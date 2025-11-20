import { NextRequest, NextResponse } from "next/server";
import { isAdmin, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("service_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const isUserAdmin = await isAdmin(payload.student_id);

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          student_id: payload.student_id,
          name: payload.name || payload.student_id,
          isAdmin: isUserAdmin,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
