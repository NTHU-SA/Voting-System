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
import {
  isValidObjectId,
  validateDateRange,
  isValidRule,
} from "@/lib/validation";
import { API_CONSTANTS } from "@/lib/constants";

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

// GET /api/activities/[id] - Get single activity
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

    const searchParams = request.nextUrl.searchParams;
    const includeOptions = searchParams.get("include_options") === "true";

    let query = Activity.findById(id);

    if (includeOptions) {
      query = query.populate("options");
    }

    const activity = await query.exec();

    if (!activity) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND, 404);
    }

    return createSuccessResponse(activity);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get activity";
    console.error("Get activity error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}

// PUT /api/activities/[id] - Update activity (Admin only)
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
    const { name, type, description, rule, open_from, open_to } = body;

    // Validate rule if provided
    if (rule && !isValidRule(rule)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_RULE);
    }

    // Validate dates if provided
    if (open_from && open_to) {
      const openFrom = new Date(open_from);
      const openTo = new Date(open_to);

      const dateValidation = validateDateRange(openFrom, openTo);
      if (!dateValidation.valid) {
        return createErrorResponse(dateValidation.error!);
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (rule) updateData.rule = rule;
    if (open_from) updateData.open_from = new Date(open_from);
    if (open_to) updateData.open_to = new Date(open_to);

    const activity = await Activity.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!activity) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND, 404);
    }

    return createSuccessResponse(activity);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update activity";
    console.error("Update activity error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}

// DELETE /api/activities/[id] - Delete activity (Admin only)
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

    // Delete all related options first
    await Option.deleteMany({ activity_id: id });

    const activity = await Activity.findByIdAndDelete(id);

    if (!activity) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: "Activity deleted successfully" });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete activity";
    console.error("Delete activity error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
