import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/middleware";
import connectDB from "@/lib/db";
import { calculateActivityStatistics } from "@/lib/statisticsService";
import { isValidObjectId } from "@/lib/validation";
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

    if (!isValidObjectId(activity_id)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID, 400);
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
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get statistics";
    console.error("Get statistics error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
