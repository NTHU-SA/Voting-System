import { NextResponse } from "next/server";
import { getBaseURL, isProduction } from "@/lib/config";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/", getBaseURL()),
  );

  // Clear token cookie
  response.cookies.set("service_token", "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
