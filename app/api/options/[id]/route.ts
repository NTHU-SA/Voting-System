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

// GET /api/options/[id] - Get single option
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID, 400);
    }

    const option = await Option.findById(id);

    if (!option) {
      return createErrorResponse(API_CONSTANTS.ERRORS.OPTION_NOT_FOUND, 404);
    }

    return createSuccessResponse(option);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get option";
    console.error("Get option error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}

// PUT /api/options/[id] - Update option (Admin only)
export async function PUT(
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

    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (body.label !== undefined) updateData.label = body.label;
    if (body.candidate !== undefined) updateData.candidate = body.candidate;
    if (body.vice1 !== undefined) updateData.vice1 = body.vice1;
    if (body.vice2 !== undefined) updateData.vice2 = body.vice2;

    const option = await Option.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!option) {
      return createErrorResponse(API_CONSTANTS.ERRORS.OPTION_NOT_FOUND, 404);
    }

    return createSuccessResponse(option);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update option";
    console.error("Update option error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}

// DELETE /api/options/[id] - Delete option (Admin only)
export async function DELETE(
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

    const option = await Option.findById(id);

    if (!option) {
      return createErrorResponse(API_CONSTANTS.ERRORS.OPTION_NOT_FOUND, 404);
    }

    // Remove option from activity's options array
    await Activity.updateOne(
      { _id: option.activity_id },
      { $pull: { options: option._id } },
    );

    await Option.findByIdAndDelete(id);

    return createSuccessResponse({ message: "Option deleted successfully" });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete option";
    console.error("Delete option error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
