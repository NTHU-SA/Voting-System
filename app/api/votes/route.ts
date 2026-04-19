import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireAdminAuth,
  createErrorResponse,
  createSuccessResponse,
  validateObjectIdOrError,
  createInternalErrorResponse,
} from "@/lib/middleware";
import { loadVoterList, isStudentEligible } from "@/lib/voterList";
import { Vote } from "@/lib/models/Vote";
import connectDB from "@/lib/db";
import { createVote } from "@/lib/votingService";
import { isValidRule } from "@/lib/validation";
import { validatePagination } from "@/lib/validation";
import { API_CONSTANTS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    await connectDB();

    const body = await request.json();
    const { activity_id, rule, choose_all, choose_one } = body;

    // Validate rule
    if (!isValidRule(rule)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_RULE);
    }

    if (!activity_id) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID, 400);
    }

    const invalidActivityIdResponse = validateObjectIdOrError(activity_id);
    if (invalidActivityIdResponse) {
      return invalidActivityIdResponse;
    }

    if (!body[rule]) {
      return createErrorResponse(
        `${API_CONSTANTS.ERRORS.MISSING_FIELD}: ${rule}`,
      );
    }

    if (rule === "choose_all") {
      if (!Array.isArray(choose_all) || choose_all.length === 0) {
        return createErrorResponse(
          `${API_CONSTANTS.ERRORS.MISSING_FIELD}: choose_all`,
          400,
        );
      }
    }

    if (rule === "choose_one") {
      if (typeof choose_one !== "string" || !choose_one.trim()) {
        return createErrorResponse(
          `${API_CONSTANTS.ERRORS.MISSING_FIELD}: choose_one`,
          400,
        );
      }
    }

    // Check if student is eligible to vote
    const voterList = await loadVoterList();
    if (!isStudentEligible(user.student_id, voterList)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.VOTE_NOT_ELIGIBLE, 403);
    }

    // Create vote using service
    const result = await createVote({
      activity_id,
      rule,
      choose_all,
      choose_one,
      student_id: user.student_id,
    });

    if (!result.success) {
      return createErrorResponse(
        result.error || "Failed to create vote",
        result.statusCode || 500,
      );
    }

    return createSuccessResponse(result.vote, 201);
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to create vote",
      "Create vote error",
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const activity_id = searchParams.get("activity_id");
    const { limit, skip } = validatePagination({
      limit: searchParams.get("limit"),
      skip: searchParams.get("skip"),
    });

    const filter: Record<string, unknown> = {};
    if (activity_id) {
      const invalidActivityIdResponse = validateObjectIdOrError(activity_id);
      if (invalidActivityIdResponse) {
        return invalidActivityIdResponse;
      }
      filter.activity_id = activity_id;
    }

    const total = await Vote.countDocuments(filter);
    const data = await Vote.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ created_at: -1 });

    return createSuccessResponse({ total, data });
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to get votes",
      "Get votes error",
    );
  }
}
