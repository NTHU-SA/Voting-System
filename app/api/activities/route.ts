import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireAdmin,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/middleware";
import { Activity } from "@/lib/models/Activity";
import { IActivity } from "@/types";
import {
  validateDateRange,
  isValidRule,
  validateRequiredFields,
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

// GET /api/activities - List all activities
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeOptions = searchParams.get("include_options") === "true";

    let activities: IActivity[];
    
    if (includeOptions) {
      activities = await Activity.find().sort({ created_at: -1 }).populate("options").exec();
    } else {
      activities = await Activity.find().sort({ created_at: -1 }).exec();
    }

    return createSuccessResponse(activities);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get activities";
    console.error("Get activities error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}

// POST /api/activities - Create new activity (Admin only)
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

    const body = await request.json();
    const { name, type, description, rule, open_from, open_to } =
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
      description,
      rule,
      open_from: openFrom,
      open_to: openTo,
      users: [],
      options: [],
      created_at: new Date(),
      updated_at: new Date(),
    });

    return createSuccessResponse(activity, 201);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create activity";
    console.error("Create activity error:", error);
    return createErrorResponse(errorMessage, 500);
  }
}
