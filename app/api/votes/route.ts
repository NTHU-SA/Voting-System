import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireAdmin,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/middleware";
import { loadVoterList, isStudentEligible } from "@/lib/voterList";
import { Vote } from "@/lib/models/Vote";
import connectDB from "@/lib/db";
import { createVote } from "@/lib/votingService";
import { isValidObjectId, isValidRule } from "@/lib/validation";
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

    if (!activity_id || !isValidObjectId(activity_id)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID, 400);
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

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const activity_id = searchParams.get("activity_id");
    const { limit, skip } = validatePagination({
      limit: searchParams.get("limit"),
      skip: searchParams.get("skip"),
    });

    const filter: Record<string, unknown> = {};
    if (activity_id) {
      if (!isValidObjectId(activity_id)) {
        return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID, 400);
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
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get votes";
    console.error("Get votes error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
