import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  createErrorResponse,
  createSuccessResponse,
  createInternalErrorResponse,
} from "@/lib/middleware";
import { Activity } from "@/lib/models/Activity";
import connectDB from "@/lib/db";
import {
  validateDateRange,
  isValidRule,
  validateRequiredFields,
} from "@/lib/validation";
import { API_CONSTANTS } from "@/lib/constants";

// GET /api/activities - List all activities
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const includeOptions = searchParams.get("include_options") === "true";

    let query = Activity.find().sort({ created_at: -1 });

    if (includeOptions) {
      query = query.populate("options");
    }

    const activities = await query.exec();

    return createSuccessResponse(activities);
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to get activities",
      "Get activities error",
    );
  }
}

// POST /api/activities - Create new activity (Admin only)
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    await connectDB();

    const body = await request.json();
    const { name, type, subtitle, description, rule, open_from, open_to } =
      body;

    // Validate required fields using helper
    const validation = validateRequiredFields(body, [
      "name",
      "type",
      "rule",
      "open_from",
      "open_to",
    ]);
    if (!validation.valid) {
      return createErrorResponse(
        `${API_CONSTANTS.ERRORS.MISSING_FIELD}: ${validation.missingFields?.join(", ")}`,
      );
    }

    // Validate rule
    if (!isValidRule(rule)) {
      return createErrorResponse(API_CONSTANTS.ERRORS.INVALID_RULE);
    }

    // Validate dates
    const openFrom = new Date(open_from);
    const openTo = new Date(open_to);

    const dateValidation = validateDateRange(openFrom, openTo);
    if (!dateValidation.valid) {
      return createErrorResponse(dateValidation.error!);
    }

    const activity = await Activity.create({
      name,
      type,
      subtitle,
      description,
      rule,
      eligible_voters_count: 0,
      open_from: openFrom,
      open_to: openTo,
      users: [],
      options: [],
      created_at: new Date(),
      updated_at: new Date(),
    });

    return createSuccessResponse(activity, 201);
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to create activity",
      "Create activity error",
    );
  }
}
