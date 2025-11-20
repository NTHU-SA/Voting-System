import { NextRequest, NextResponse } from "next/server";
import { mockAuthStore } from "@/lib/mockAuthStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body.code;

    let mockData = null;

    // Try to get mock data from the in-memory store
    if (code) {
      mockData = mockAuthStore.get(code);
      if (mockData) {
        console.log(
          "[Mock Token] Found custom mock data for code:",
          code,
          "data:",
          mockData,
        );
        // Delete the code after use (one-time use)
        mockAuthStore.delete(code);
      } else {
        console.log(
          "[Mock Token] No data found for code:",
          code,
          "using fallback",
        );
      }
    }

    if (!mockData) {
      throw new Error("No mock data found for the provided code");
    }

    // Generate access token
    const accessToken = "mock_access_token_" + Date.now();

    // Store mock data by access token for the resource endpoint
    mockAuthStore.set(accessToken, mockData);

    // Create response with token
    return NextResponse.json({
      access_token: accessToken,
      expires_in: 3600,
      token_type: "Bearer",
      scope: "userid name inschool uuid",
      refresh_token: "mock_refresh_token",
    });
  } catch (error) {
    console.error("Token route error:", error);
    const fallbackToken = "mock_access_token_" + Date.now();
    return NextResponse.json({
      access_token: fallbackToken,
      expires_in: 3600,
      token_type: "Bearer",
      scope: "userid name inschool uuid",
      refresh_token: "mock_refresh_token",
    });
  }
}
