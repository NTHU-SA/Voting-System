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
  return (
    error instanceof MongoServerError &&
    (error.code === 20 ||
      error.codeName === "IllegalOperation" ||
      /Transaction numbers are only allowed on a replica set member or mongos/i.test(
        error.message,
      ))
  );
}

async function supportsMongoTransactions(
  db: Awaited<ReturnType<typeof connectDB>>,
): Promise<boolean> {
  if (!db.connection.db) {
    return false;
  }

  try {
    const hello = (await db.connection.db.admin().command({ hello: 1 })) as {
      setName?: string;
      msg?: string;
    };
    return Boolean(hello.setName) || hello.msg === "isdbgrid";
  } catch (error: unknown) {
    console.warn(
      "Could not determine MongoDB transaction support; using non-transactional voter upload.",
      error,
    );
    return false;
  }
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

    const count = await ActivityVoter.countDocuments({ activity_id: id });

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

    const replaceVoters = async (options?: { session?: ClientSession }) => {
      await ActivityVoter.deleteMany({ activity_id: id }, options);
      await ActivityVoter.insertMany(voterDocuments, {
        ordered: false,
        ...(options?.session ? { session: options.session } : {}),
      });
      await Activity.updateOne(
        { _id: id },
        {
          $set: {
            eligible_voters_count: studentIds.length,
            updated_at: new Date(),
          },
        },
        {
          ...(options?.session ? { session: options.session } : {}),
        },
      );
    };

    const supportsTransactions = await supportsMongoTransactions(db);

    if (!supportsTransactions) {
      await replaceVoters();
    } else {
      const session = await db.startSession();
      try {
        await session.withTransaction(async () => {
          await replaceVoters({ session });
        });
      } catch (error: unknown) {
        if (!isTransactionUnsupportedError(error)) {
          throw error;
        }
        await replaceVoters();
      } finally {
        await session.endSession();
      }
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
