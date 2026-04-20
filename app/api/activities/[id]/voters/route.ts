import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { MongoServerError, type ClientSession } from "mongodb";
import {
  requireAdminAuth,
  createErrorResponse,
  createSuccessResponse,
  validateObjectIdOrError,
  createInternalErrorResponse,
} from "@/lib/middleware";
import connectDB from "@/lib/db";
import { Activity } from "@/lib/models/Activity";
import { ActivityVoter } from "@/lib/models/ActivityVoter";
import { API_CONSTANTS } from "@/lib/constants";
import { getEligibleVotersCount } from "@/lib/activityVoterService";

function extractStudentIds(csvText: string): string[] {
  const records = parse(csvText, {
    skip_empty_lines: true,
    trim: true,
  }) as string[][];

  const result: string[] = [];
  for (const row of records) {
    const value = row?.[0]?.trim();
    if (!value) continue;
    if (value.toLowerCase() === "student_id") continue;
    result.push(value);
  }

  return [...new Set(result)];
}

function isTransactionUnsupportedError(error: unknown): boolean {
  const unsupportedTransactionMessage =
    "Transaction numbers are only allowed on a replica set member or mongos";
  return (
    error instanceof MongoServerError &&
    error.message.includes(unsupportedTransactionMessage)
  );
}

const TRANSACTION_SUPPORT_CACHE_TTL_MS = 5 * 60 * 1000;
const TRANSACTION_SUPPORT_ERROR_CACHE_TTL_MS = 30 * 1000;
const MAX_NON_TRANSACTIONAL_ATTEMPTS = 4;
const INITIAL_NON_TRANSACTIONAL_RETRY_BACKOFF_MS = 20;
const MAX_NON_TRANSACTIONAL_RETRY_BACKOFF_MS = 500;
let transactionSupportCache:
  | {
      value: boolean;
      expiresAt: number;
    }
  | null = null;

type MongoHelloResponse = {
  setName?: string;
  msg?: string;
};

async function supportsMongoTransactions(
  db: Awaited<ReturnType<typeof connectDB>>,
): Promise<boolean> {
  const now = Date.now();
  if (transactionSupportCache && transactionSupportCache.expiresAt > now) {
    return transactionSupportCache.value;
  }

  if (!db.connection.db) {
    transactionSupportCache = {
      value: false,
      expiresAt: now + TRANSACTION_SUPPORT_ERROR_CACHE_TTL_MS,
    };
    return false;
  }

  try {
    const hello = (await db.connection.db.admin().command({
      hello: 1,
    })) as MongoHelloResponse;
    const supportsTransactions =
      Boolean(hello.setName) || hello.msg === "isdbgrid";
    transactionSupportCache = {
      value: supportsTransactions,
      expiresAt: now + TRANSACTION_SUPPORT_CACHE_TTL_MS,
    };

    return supportsTransactions;
  } catch (error: unknown) {
    console.warn(
      "Could not determine MongoDB transaction support; using non-transactional voter upload.",
      error,
    );
    transactionSupportCache = {
      value: false,
      expiresAt: now + TRANSACTION_SUPPORT_ERROR_CACHE_TTL_MS,
    };
    return false;
  }
}

function isRetryableNonTransactionalError(error: unknown): boolean {
  if (
    error instanceof MongoServerError &&
    (error.code === 11000 ||
      error.codeName === "WriteConflict" ||
      error.hasErrorLabel("RetryableWriteError"))
  ) {
    return true;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "writeErrors" in error &&
    Array.isArray(error.writeErrors)
  ) {
    return error.writeErrors.some(
      (writeError: unknown) =>
        typeof writeError === "object" &&
        writeError !== null &&
        "code" in writeError &&
        writeError.code === 11000,
    );
  }

  return false;
}

// GET /api/activities/[id]/voters - Get activity voter stats (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    await connectDB();
    const { id } = await params;

    const invalidIdResponse = validateObjectIdOrError(id);
    if (invalidIdResponse) {
      return invalidIdResponse;
    }

    const activity = await Activity.findById(id).select(
      "_id name eligible_voters_count",
    );
    if (!activity) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND, 404);
    }

    const count = await getEligibleVotersCount(id);

    return createSuccessResponse({
      activity_id: id,
      activity_name: activity.name,
      eligible_voters_count: count,
      stored_eligible_voters_count: activity.eligible_voters_count || 0,
    });
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to get activity voters",
      "Get activity voters error",
    );
  }
}

// POST /api/activities/[id]/voters - Upload CSV voter list (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const db = await connectDB();
    const { id } = await params;

    const invalidIdResponse = validateObjectIdOrError(id);
    if (invalidIdResponse) {
      return invalidIdResponse;
    }

    const activity = await Activity.findById(id).select("_id");
    if (!activity) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND, 404);
    }

    const formData = await request.formData();
    const csvFile = formData.get("file");
    if (!(csvFile instanceof File)) {
      return createErrorResponse("Missing CSV file", 400);
    }

    const csvText = await csvFile.text();
    const studentIds = extractStudentIds(csvText);
    if (studentIds.length === 0) {
      return createErrorResponse("CSV does not contain valid student IDs", 400);
    }

    const voterDocuments = studentIds.map((studentId) => ({
      activity_id: id,
      student_id: studentId,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    const replaceVotersWithTransaction = async (session: ClientSession) => {
      await ActivityVoter.deleteMany({ activity_id: id }, { session });
      await ActivityVoter.insertMany(voterDocuments, {
        ordered: false,
        session,
      });
      await Activity.updateOne(
        { _id: id },
        {
          $set: {
            eligible_voters_count: studentIds.length,
            updated_at: new Date(),
          },
        },
        { session },
      );
    };

    const replaceVotersWithoutTransaction = async () => {
      const now = new Date();
      const upsertOperations = voterDocuments.map((voterDocument) => ({
        updateOne: {
          filter: {
            activity_id: voterDocument.activity_id,
            student_id: voterDocument.student_id,
          },
          update: {
            $set: { updated_at: now },
            $setOnInsert: {
              activity_id: voterDocument.activity_id,
              student_id: voterDocument.student_id,
              created_at: now,
            },
          },
          upsert: true,
        },
      }));

      const applyReplacement = async () => {
        await ActivityVoter.bulkWrite(upsertOperations, { ordered: false });
        await ActivityVoter.deleteMany({
          activity_id: id,
          student_id: { $nin: studentIds },
        });
        await Activity.updateOne(
          { _id: id },
          {
            $set: {
              eligible_voters_count: studentIds.length,
              updated_at: new Date(),
            },
          },
        );
      };

      for (let attempt = 1; attempt <= MAX_NON_TRANSACTIONAL_ATTEMPTS; attempt++) {
        try {
          await applyReplacement();
          return;
        } catch (error: unknown) {
          const isFinalAttempt = attempt === MAX_NON_TRANSACTIONAL_ATTEMPTS;
          if (!isRetryableNonTransactionalError(error) || isFinalAttempt) {
            throw error;
          }
          const backoffMs = Math.min(
            INITIAL_NON_TRANSACTIONAL_RETRY_BACKOFF_MS * 2 ** (attempt - 1),
            MAX_NON_TRANSACTIONAL_RETRY_BACKOFF_MS,
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    };

    const supportsTransactions = await supportsMongoTransactions(db);

    if (supportsTransactions) {
      const session = await db.startSession();
      try {
        await session.withTransaction(async () => {
          await replaceVotersWithTransaction(session);
        });
      } catch (error: unknown) {
        if (!isTransactionUnsupportedError(error)) {
          throw error;
        }
        await replaceVotersWithoutTransaction();
      } finally {
        await session.endSession();
      }
    } else {
      await replaceVotersWithoutTransaction();
    }

    return createSuccessResponse({
      activity_id: id,
      eligible_voters_count: studentIds.length,
      message: "Voter list uploaded successfully",
    });
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to upload voter list",
      "Upload voter list error",
    );
  }
}
