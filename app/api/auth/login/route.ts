import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationURL } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirect = searchParams.get("redirect");

  // Pass redirect parameter as state to preserve it through OAuth flow
  const authUrl = getAuthorizationURL(redirect || undefined);
  return NextResponse.redirect(authUrl);
}
