import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  createErrorResponse,
  createSuccessResponse,
  validateObjectIdOrError,
  createInternalErrorResponse,
} from "@/lib/middleware";
import { Activity } from "@/lib/models/Activity";
import { Option } from "@/lib/models/Option";
import connectDB from "@/lib/db";
import { API_CONSTANTS } from "@/lib/constants";

// GET /api/options - List options for an activity
export async function GET(request: NextRequest) {
  try {
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

    const options = await Option.find({ activity_id }).sort({ created_at: 1 });

    return createSuccessResponse(options);
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to get options",
      "Get options error",
    );
  }
}

// POST /api/options - Create new option (Admin only)
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    await connectDB();

    const body = await request.json();
    const { activity_id, label, candidate, vice } = body;

    // Validate required fields
    if (!activity_id) {
      return createErrorResponse(
        `${API_CONSTANTS.ERRORS.MISSING_FIELD}: activity_id`,
      );
    }

    const invalidIdResponse = validateObjectIdOrError(activity_id);
    if (invalidIdResponse) {
      return invalidIdResponse;
    }

    // Check if activity exists
    const activity = await Activity.findById(activity_id);
    if (!activity) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND, 404);
    }

    const option = await Option.create({
      activity_id,
      label,
      candidate,
      vice: vice || [],
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Add option to activity's options array
    await Activity.updateOne(
      { _id: activity_id },
      { $addToSet: { options: option._id } },
    );

    return createSuccessResponse(option, 201);
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to create option",
      "Create option error",
    );
  }
}
