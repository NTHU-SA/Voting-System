import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  createInternalErrorResponse,
} from "@/lib/middleware";
import connectDB from "@/lib/db";
import { Admin } from "@/lib/models/Admin";
import { isRootAdmin, getRootAdminStudentId } from "@/lib/auth";
import { API_CONSTANTS } from "@/lib/constants";

async function requireRootAdmin(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  if (!isRootAdmin(authResult.student_id)) {
    return createErrorResponse(API_CONSTANTS.ERRORS.ADMIN_REQUIRED, 403);
  }
  return authResult;
}

// GET /api/admins - list admins (ROOT_ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRootAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await connectDB();
    const rootAdmin = getRootAdminStudentId();
    const admins = await Admin.find().sort({ created_at: -1 }).lean();

    return createSuccessResponse({
      root_admin: rootAdmin,
      admins,
    });
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to get admins",
      "Get admins error",
    );
  }
}

// POST /api/admins - create admin (ROOT_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRootAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await connectDB();
    const body = await request.json();
    const studentId = body.student_id?.trim();
    const name = body.name?.trim() || undefined;

    if (!studentId) {
      return createErrorResponse(
        `${API_CONSTANTS.ERRORS.MISSING_FIELD}: student_id`,
      );
    }

    if (isRootAdmin(studentId)) {
      return createErrorResponse("ROOT_ADMIN is managed by environment variable");
    }

    const admin = await Admin.findOneAndUpdate(
      { student_id: studentId },
      {
        $set: {
          student_id: studentId,
          name,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    return createSuccessResponse(admin, 201);
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to create admin",
      "Create admin error",
    );
  }
}

// DELETE /api/admins?student_id=xxx - delete admin (ROOT_ADMIN only)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRootAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await connectDB();
    const studentId = request.nextUrl.searchParams.get("student_id")?.trim();
    if (!studentId) {
      return createErrorResponse(
        `${API_CONSTANTS.ERRORS.MISSING_FIELD}: student_id`,
      );
    }

    if (isRootAdmin(studentId)) {
      return createErrorResponse("Cannot delete ROOT_ADMIN", 400);
    }

    const deleted = await Admin.findOneAndDelete({ student_id: studentId });
    if (!deleted) {
      return createErrorResponse("Admin not found", 404);
    }

    return createSuccessResponse({ message: "Admin deleted successfully" });
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to delete admin",
      "Delete admin error",
    );
  }
}
