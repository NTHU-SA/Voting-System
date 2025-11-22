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

  // Get access token from Authorization header
  const authHeader = request.headers.get("Authorization");

  let mockData = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const accessToken = authHeader.substring(7);
    // Retrieve mock data from store using access token
    mockData = mockAuthStore.get(accessToken);

    if (mockData) {
      console.log("[Mock Resource] Found data for access token");
      return NextResponse.json(mockData);
    }
  }

  console.log("[Mock Resource] Using fallback data");
  return NextResponse.json(mockData);
}
