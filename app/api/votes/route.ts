import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireAdmin,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/middleware";
import { loadVoterList, isStudentEligible } from "@/lib/voterList";
import { Vote } from "@/lib/models/Vote";

import { createVote } from "@/lib/votingService";
import { isValidRule } from "@/lib/validation";
import { validatePagination } from "@/lib/validation";
import { API_CONSTANTS } from "@/lib/constants";

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;


    const body = await request.json();
    const { activity_id, rule, choose_all, choose_one } = body;

    // Validate rule
    if (!isValidRule(rule)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_RULE);
    }

    if (!body[rule]) {
      return createErrorResponse(
        `${API_CONSTANTS.ERRORS.MISSING_FIELD}: ${rule}`,
      );
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
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create vote";
    console.error("Create vote error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user and require admin
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const adminCheck = await requireAdmin(user);
    if (adminCheck) {
      return adminCheck;
    }


    const searchParams = request.nextUrl.searchParams;
    const activity_id = searchParams.get("activity_id");
    const { limit, skip } = validatePagination({
      limit: searchParams.get("limit"),
      skip: searchParams.get("skip"),
    });

    const filter: Record<string, unknown> = {};
    if (activity_id) {
      filter.activity_id = activity_id;
    }

    const total = await Vote.countDocuments(filter);
    const data = await Vote.find(filter, {
      limit,
      skip,
      sort: { created_at: -1 },
    });

    return createSuccessResponse({ total, data });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get votes";
    console.error("Get votes error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
