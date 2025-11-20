import { NextRequest, NextResponse } from "next/server";
import { isAdmin, verifyToken } from "@/lib/auth";
import { JWTPayload } from "@/types";
import { API_CONSTANTS } from "@/lib/constants";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Extracts JWT token from request (Authorization header or cookie)
 */
function extractToken(request: NextRequest): string | undefined {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Fallback to cookie
  return request.cookies.get("service_token")?.value;
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest
): Promise<JWTPayload | NextResponse> {
  const token = extractToken(request);

  if (!token) {
    return createErrorResponse(API_CONSTANTS.ERRORS.AUTH_NO_TOKEN, 401);
  }

  const decoded = await verifyToken(token);

  if (!decoded) {
    return createErrorResponse(API_CONSTANTS.ERRORS.AUTH_INVALID_TOKEN, 401);
  }

  return decoded;
}

/**
 * Middleware to require admin authorization
 */
export async function requireAdmin(
  user: JWTPayload
): Promise<NextResponse | null> {
  try {
    const userIsAdmin = await isAdmin(user.student_id);

    if (!userIsAdmin) {
      return createErrorResponse(API_CONSTANTS.ERRORS.ADMIN_REQUIRED, 403);
    }

    return null;
  } catch {
    return createErrorResponse(API_CONSTANTS.ERRORS.ADMIN_REQUIRED, 403);
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}
