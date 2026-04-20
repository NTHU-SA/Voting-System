/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { GET, POST, DELETE } from "@/app/api/admins/route";
import { API_CONSTANTS } from "@/lib/constants";

jest.mock("@/lib/db", () => jest.fn());
jest.mock("@/lib/middleware", () => ({
  requireAuth: jest.fn(),
  createErrorResponse: (message: string, status = 400) =>
    NextResponse.json({ success: false, error: message }, { status }),
  createSuccessResponse: (data: unknown, status = 200) =>
    NextResponse.json({ success: true, data }, { status }),
  createInternalErrorResponse: (error: unknown, fallbackMessage: string) =>
    NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : fallbackMessage,
      },
      { status: 500 },
    ),
}));
jest.mock("@/lib/models/Admin", () => ({
  Admin: {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));
jest.mock("@/lib/auth", () => ({
  isRootAdmin: jest.fn(),
  getRootAdminStudentId: jest.fn(),
}));

const middlewareMock = jest.requireMock("@/lib/middleware") as {
  requireAuth: jest.Mock;
};
const adminModelMock = (
  jest.requireMock("@/lib/models/Admin") as {
    Admin: {
      find: jest.Mock;
      findOneAndUpdate: jest.Mock;
      findOneAndDelete: jest.Mock;
    };
  }
).Admin;
const authMock = jest.requireMock("@/lib/auth") as {
  isRootAdmin: jest.Mock;
  getRootAdminStudentId: jest.Mock;
};

describe("/api/admins route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    middlewareMock.requireAuth.mockResolvedValue({ student_id: "111000001" });
    authMock.isRootAdmin.mockImplementation((studentId: string) =>
      studentId === "111000001",
    );
    authMock.getRootAdminStudentId.mockReturnValue("111000001");
  });

  it("denies access for non-root admin user", async () => {
    authMock.isRootAdmin.mockReturnValue(false);

    const request = new NextRequest("http://localhost:3000/api/admins");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe(API_CONSTANTS.ERRORS.ADMIN_REQUIRED);
  });

  it("returns admin list for root admin", async () => {
    adminModelMock.find.mockReturnValueOnce({
      sort: () => ({
        lean: async () => [{ student_id: "111000002" }],
      }),
    });

    const request = new NextRequest("http://localhost:3000/api/admins");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.root_admin).toBe("111000001");
    expect(body.data.admins).toEqual([{ student_id: "111000002" }]);
  });

  it("upserts admin on POST", async () => {
    adminModelMock.findOneAndUpdate.mockResolvedValueOnce({
      student_id: "111000002",
      name: "Test Admin",
    });

    const request = new NextRequest("http://localhost:3000/api/admins", {
      method: "POST",
      body: JSON.stringify({ student_id: "111000002", name: "Test Admin" }),
      headers: { "content-type": "application/json" },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(adminModelMock.findOneAndUpdate).toHaveBeenCalled();
  });

  it("returns 404 when deleting a non-existent admin", async () => {
    adminModelMock.findOneAndDelete.mockResolvedValueOnce(null);

    const request = new NextRequest(
      "http://localhost:3000/api/admins?student_id=111000009",
      { method: "DELETE" },
    );
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Admin not found");
  });
});
