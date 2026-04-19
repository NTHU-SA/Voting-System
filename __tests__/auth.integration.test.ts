/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET as loginGet } from "@/app/api/auth/login/route";
import { GET as checkGet } from "@/app/api/auth/check/route";

jest.mock("@/lib/auth", () => ({
  verifyToken: jest.fn(),
  isAdmin: jest.fn(),
}));

const { verifyToken, isAdmin } = jest.requireMock("@/lib/auth") as {
  verifyToken: jest.Mock;
  isAdmin: jest.Mock;
};

describe("auth routes integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 500 with details when login env is missing", async () => {
    delete process.env.OAUTH_CLIENT_ID;
    delete process.env.OAUTH_CALLBACK_URL;
    delete process.env.OAUTH_SCOPE;
    delete process.env.OAUTH_AUTHORIZE;
    delete process.env.TOKEN_SECRET;

    const request = new NextRequest("http://localhost:3000/api/auth/login");
    const response = await loginGet(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.details).toMatch(/Missing required environment variables/);
  });

  it("returns 401 when auth check has no token", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/check");
    const response = await checkGet(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ authenticated: false });
  });

  it("returns 401 when token is invalid", async () => {
    verifyToken.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/auth/check", {
      headers: { cookie: "service_token=bad-token" },
    });

    const response = await checkGet(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ authenticated: false });
  });

  it("returns authenticated user when token is valid", async () => {
    verifyToken.mockResolvedValueOnce({
      student_id: "111000111",
      name: "Test User",
    });
    isAdmin.mockResolvedValueOnce(true);

    const request = new NextRequest("http://localhost:3000/api/auth/check", {
      headers: { cookie: "service_token=good-token" },
    });

    const response = await checkGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(body.user.student_id).toBe("111000111");
    expect(body.user.isAdmin).toBe(true);
  });
});
