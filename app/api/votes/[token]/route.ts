import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/middleware";
import { Vote } from "@/lib/models/Vote";
import connectDB from "@/lib/db";

/**
 * GET /api/votes/[token]
 * Retrieve a vote record by its UUID token
 * Requires JWT authentication to prevent unauthorized access
 * 
 * Security considerations:
 * - JWT authentication prevents anonymous token enumeration attempts
 * - Different response codes for not found vs unauthorized provide minimal information
 * - Consider implementing rate limiting at the infrastructure level for additional protection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Authenticate user - JWT required to prevent brute force attacks on UUIDs
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await connectDB();

    const { token } = params;

    if (!token) {
      return createErrorResponse("Token is required", 400);
    }

    // Find vote by token
    const vote = await Vote.findOne({ token });

    if (!vote) {
      return createErrorResponse("Vote not found", 404);
    }

    // Return vote data
    return createSuccessResponse(vote);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get vote";
    console.error("Get vote by token error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
