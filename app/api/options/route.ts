import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireAdmin,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/middleware";
import { Activity } from "@/lib/models/Activity";
import { Option } from "@/lib/models/Option";
import connectDB from "@/lib/db";
import { isValidObjectId } from "@/lib/validation";
import { API_CONSTANTS } from "@/lib/constants";

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

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

    if (!isValidObjectId(activity_id)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID, 400);
    }

    const options = await Option.find({ activity_id }).sort({ created_at: 1 });

    return createSuccessResponse(options);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get options";
    console.error("Get options error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}

// POST /api/options - Create new option (Admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { activity_id, label, candidate, vice } = body;

    // Validate required fields
    if (!activity_id) {
      return createErrorResponse(
        `${API_CONSTANTS.ERRORS.MISSING_FIELD}: activity_id`,
      );
    }

    if (!isValidObjectId(activity_id)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID, 400);
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
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create option";
    console.error("Create option error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
