import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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
