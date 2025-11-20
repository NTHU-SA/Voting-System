import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireAdmin,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/middleware";
import { Vote } from "@/lib/models/Vote";
import connectDB from "@/lib/db";
import { isValidObjectId } from "@/lib/validation";
import { API_CONSTANTS } from "@/lib/constants";

// GET /api/activities/[id]/verification - Get voted UUIDs for verification (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID, 400);
    }

    // Get all votes for this activity with only the token field
    const votes = await Vote.find({ activity_id: id })
      .select("token created_at")
      .sort({ created_at: -1 })
      .lean();

    // Return the list of UUIDs and count
    return createSuccessResponse({
      activity_id: id,
      total_votes: votes.length,
      voted_tokens: votes.map((v) => ({
        uuid: v.token,
        voted_at: v.created_at,
      })),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to get verification data";
    console.error("Get verification error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
