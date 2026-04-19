import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  createSuccessResponse,
  validateObjectIdOrError,
  createInternalErrorResponse,
} from "@/lib/middleware";
import { Vote } from "@/lib/models/Vote";
import connectDB from "@/lib/db";

// GET /api/activities/[id]/verification - Get voted UUIDs for verification (Admin only)
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
    return createInternalErrorResponse(
      error,
      "Failed to get verification data",
      "Get verification error",
    );
  }
}
