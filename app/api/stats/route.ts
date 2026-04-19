import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  createErrorResponse,
  createSuccessResponse,
  validateObjectIdOrError,
  createInternalErrorResponse,
} from "@/lib/middleware";
import connectDB from "@/lib/db";
import { calculateActivityStatistics } from "@/lib/statisticsService";
import { API_CONSTANTS } from "@/lib/constants";

// GET /api/stats?activity_id=xxx - Get statistics for an activity (Admin only)
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const activity_id = searchParams.get("activity_id");

    if (!activity_id) {
      return createErrorResponse(
        `${API_CONSTANTS.ERRORS.MISSING_FIELD}: activity_id`,
      );
    }

    const invalidIdResponse = validateObjectIdOrError(activity_id);
    if (invalidIdResponse) {
      return invalidIdResponse;
    }

    // Calculate statistics using service
    const result = await calculateActivityStatistics(activity_id);

    if (!result.success) {
      return createErrorResponse(
        result.error || "Failed to get statistics",
        result.statusCode || 500,
      );
    }

    return createSuccessResponse(result.data);
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to get statistics",
      "Get statistics error",
    );
  }
}
