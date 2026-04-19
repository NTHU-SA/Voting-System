import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationURL } from "@/lib/oauth";
import { validateLoginEnv } from "@/lib/validateEnv";

export async function GET(request: NextRequest) {
  try {
    validateLoginEnv();

    const searchParams = request.nextUrl.searchParams;
    const redirect = searchParams.get("redirect");

    // Pass redirect parameter as state to preserve it through OAuth flow
    const authUrl = getAuthorizationURL(redirect || undefined);
    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to initialize OAuth login";

    console.error("Auth login initialization error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize login",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
