import { NextRequest, NextResponse } from "next/server";
import { isProduction } from "@/lib/config";

export async function GET(request: NextRequest) {
  // Disable mock API in production
  if (isProduction()) {
    return NextResponse.json(
      { error: "Mock API is not available in production" },
      { status: 404 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get("redirect_uri");
  const clientId = searchParams.get("client_id");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");

  if (!redirectUri) {
    return NextResponse.json(
      { error: "Missing redirect_uri" },
      { status: 400 },
    );
  }

  // Redirect to mock authorization page where user can input their data
  const authPageUrl = new URL("/api/mock/authorize", request.url);
  authPageUrl.searchParams.set("redirect_uri", redirectUri);
  if (clientId) {
    authPageUrl.searchParams.set("client_id", clientId);
  }
  if (scope) {
    authPageUrl.searchParams.set("scope", scope);
  }
  if (state) {
    authPageUrl.searchParams.set("state", state);
  }

  return NextResponse.redirect(authPageUrl);
}
