/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/verify/[token]/route";

jest.mock("@/lib/db", () => jest.fn());
jest.mock("@/lib/models/Vote", () => ({
  Vote: {
    findOne: jest.fn(),
  },
}));
jest.mock("@/lib/models/Activity", () => ({
  Activity: {
    findById: jest.fn(),
  },
}));
jest.mock("@/lib/models/Option", () => ({
  Option: {
    find: jest.fn(),
  },
}));
jest.mock("@/lib/middleware", () => ({
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

const voteModelMock = (
  jest.requireMock("@/lib/models/Vote") as {
    Vote: {
      findOne: jest.Mock;
    };
  }
).Vote;

const activityModelMock = (
  jest.requireMock("@/lib/models/Activity") as {
    Activity: {
      findById: jest.Mock;
    };
  }
).Activity;

const optionModelMock = (
  jest.requireMock("@/lib/models/Option") as {
    Option: {
      find: jest.Mock;
    };
  }
).Option;

describe("/api/verify/[token] route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when UUID is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/verify/%20");
    const response = await GET(request, { params: Promise.resolve({ token: " " }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("UUID 為必填欄位");
  });

  it("returns 404 when vote does not exist", async () => {
    voteModelMock.findOne.mockReturnValueOnce({
      lean: async () => null,
    });

    const request = new NextRequest("http://localhost:3000/api/verify/abc");
    const response = await GET(request, {
      params: Promise.resolve({ token: "abc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("找不到此 UUID 的投票記錄");
  });

  it("returns vote verification details for choose_one", async () => {
    voteModelMock.findOne.mockReturnValueOnce({
      lean: async () => ({
        token: "vote-token",
        activity_id: "507f1f77bcf86cd799439011",
        rule: "choose_one",
        choose_one: "507f1f77bcf86cd799439012",
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      }),
    });
    activityModelMock.findById.mockReturnValueOnce({
      select: () => ({
        lean: async () => ({ name: "測試活動" }),
      }),
    });
    optionModelMock.find.mockReturnValueOnce({
      select: () => ({
        lean: async () => [
          {
            _id: "507f1f77bcf86cd799439012",
            label: "候選人 A",
          },
        ],
      }),
    });

    const request = new NextRequest("http://localhost:3000/api/verify/vote-token");
    const response = await GET(request, {
      params: Promise.resolve({ token: "vote-token" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.activity_name).toBe("測試活動");
    expect(body.data.selections).toEqual(["候選人 A"]);
  });
});
