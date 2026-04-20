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
import { validateDateRange, isValidRule } from "@/lib/validation";
import { API_CONSTANTS } from "@/lib/constants";

interface ActivityUpdateBody {
  name?: string;
  type?: string;
  description?: string;
  rule?: string;
  open_from?: string;
  open_to?: string;
}

function buildActivityUpdateData(body: ActivityUpdateBody) {
  const { name, type, description, rule, open_from, open_to } = body;
  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (name) updateData.name = name;
  if (type) updateData.type = type;
  if (description !== undefined) updateData.description = description;
  if (rule) updateData.rule = rule;
  if (open_from) updateData.open_from = new Date(open_from);
  if (open_to) updateData.open_to = new Date(open_to);

  return updateData;
}

// GET /api/activities/[id] - Get single activity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    const invalidIdResponse = validateObjectIdOrError(id);
    if (invalidIdResponse) {
      return invalidIdResponse;
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
    return createInternalErrorResponse(
      error,
      "Failed to get activity",
      "Get activity error",
    );
  }
}

// PUT /api/activities/[id] - Update activity (Admin only)
export async function PUT(
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

    const rawBody = (await request.json()) as Record<string, unknown>;
    const body: ActivityUpdateBody = {
      name: typeof rawBody.name === "string" ? rawBody.name : undefined,
      type: typeof rawBody.type === "string" ? rawBody.type : undefined,
      description:
        typeof rawBody.description === "string" ? rawBody.description : undefined,
      rule: typeof rawBody.rule === "string" ? rawBody.rule : undefined,
      open_from:
        typeof rawBody.open_from === "string" ? rawBody.open_from : undefined,
      open_to: typeof rawBody.open_to === "string" ? rawBody.open_to : undefined,
    };
    const { rule, open_from, open_to } = body;

    // Validate rule if provided
    if (rule && !isValidRule(rule)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_RULE);
    }

    // Validate dates if provided
    if (open_from && open_to) {
      const openFrom = new Date(open_from as string);
      const openTo = new Date(open_to as string);

      const dateValidation = validateDateRange(openFrom, openTo);
      if (!dateValidation.valid) {
        return createErrorResponse(dateValidation.error!);
      }
    }

    const updateData = buildActivityUpdateData(body);

    const activity = await Activity.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!activity) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND, 404);
    }

    return createSuccessResponse(activity);
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to update activity",
      "Update activity error",
    );
  }
}

// DELETE /api/activities/[id] - Delete activity (Admin only)
export async function DELETE(
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

    // Delete all related options first
    await Option.deleteMany({ activity_id: id });

    const activity = await Activity.findByIdAndDelete(id);

    if (!activity) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND, 404);
    }

    return createSuccessResponse({ message: "Activity deleted successfully" });
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to delete activity",
      "Delete activity error",
    );
  }
}
