import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getUserInfo } from "@/lib/oauth";
import { generateToken } from "@/lib/auth";
import { API_CONSTANTS } from "@/lib/constants";
import { isProduction } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error === "access_denied" || !code) {
      return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
    }

    // Parse state to get redirect URL
    let redirectPath = "/vote"; // Default redirect
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        if (stateData.redirect) {
          redirectPath = stateData.redirect;
        }
      } catch {
        // Invalid state, use default redirect
      }
    }

    // Exchange code for access token
    const tokenInfo = await exchangeCodeForToken(code);

    // Get user info from OAuth (Userid field maps to student_id)
    const userInfo = await getUserInfo(tokenInfo.access_token);
    const studentId = userInfo.Userid; // OAuth returns "Userid", we map it to student_id
    const userName = userInfo.name || studentId;

    // Generate service token with name included (no database lookup needed)
    const serviceToken = await generateToken({
      _id: studentId, // Use student_id as _id
      student_id: studentId,
      name: userName,
    });

    // Create response with redirect to the original destination
    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    // Set token in cookie
    response.cookies.set("service_token", serviceToken, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: "lax",
      maxAge: API_CONSTANTS.COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";
    console.error("OAuth callback error:", errorMessage);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}
