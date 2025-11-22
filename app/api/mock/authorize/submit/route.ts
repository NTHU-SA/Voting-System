import { NextRequest, NextResponse } from "next/server";
import { mockAuthStore } from "@/lib/mockAuthStore";

export async function POST(request: NextRequest) {
  // Disable mock API in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Mock API is not available in production" },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();
    const { code, mockData, redirectUri } = body;

    if (!code || !mockData || !redirectUri) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Store the mock data in the in-memory store
    mockAuthStore.set(code, mockData);
    console.log(
      "[Mock Authorize Submit] Stored data for code:",
      code,
      "data:",
      mockData,
    );

    return NextResponse.json({ success: true, redirectUri });
  } catch (error) {
    console.error("Error in mock authorize submit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
