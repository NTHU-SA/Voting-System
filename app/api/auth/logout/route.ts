import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  );

  // Clear token cookie
  response.cookies.set("service_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
