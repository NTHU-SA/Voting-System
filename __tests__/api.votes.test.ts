/** @jest-environment node */

import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "@/app/api/votes/route";
import { API_CONSTANTS } from "@/lib/constants";

jest.mock("@/lib/middleware", () => ({
  requireAuth: jest.fn(),
  requireAdmin: jest.fn(),
  createErrorResponse: (message: string, status = 400) =>
    NextResponse.json({ success: false, error: message }, { status }),
  createSuccessResponse: (data: unknown, status = 200) =>
    NextResponse.json({ success: true, data }, { status }),
}));

jest.mock("@/lib/voterList", () => ({
  loadVoterList: jest.fn(),
  isStudentEligible: jest.fn(),
}));

jest.mock("@/lib/db", () => jest.fn());
jest.mock("@/lib/votingService", () => ({ createVote: jest.fn() }));
jest.mock("@/lib/models/Vote", () => ({
  Vote: {
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));

const middlewareMock = jest.requireMock("@/lib/middleware") as {
  requireAuth: jest.Mock;
  requireAdmin: jest.Mock;
};
const voterListMock = jest.requireMock("@/lib/voterList") as {
  loadVoterList: jest.Mock;
  isStudentEligible: jest.Mock;
};
const createVoteMock = (jest.requireMock("@/lib/votingService") as {
  createVote: jest.Mock;
}).createVote;
const voteModelMock = (jest.requireMock("@/lib/models/Vote") as {
  Vote: {
    countDocuments: jest.Mock;
    find: jest.Mock;
  };
}).Vote;

describe("/api/votes route", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    middlewareMock.requireAuth.mockResolvedValue({ student_id: "111000111" });
    middlewareMock.requireAdmin.mockResolvedValue(null);
    voterListMock.loadVoterList.mockResolvedValue(["111000111"]);
    voterListMock.isStudentEligible.mockReturnValue(true);
  });

  it("rejects choose_all empty array", async () => {
    const request = new NextRequest("http://localhost:3000/api/votes", {
      method: "POST",
      body: JSON.stringify({
        activity_id: "507f1f77bcf86cd799439011",
        rule: "choose_all",
        choose_all: [],
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("choose_all");
  });

  it("rejects choose_one missing value", async () => {
    const request = new NextRequest("http://localhost:3000/api/votes", {
      method: "POST",
      body: JSON.stringify({
        activity_id: "507f1f77bcf86cd799439011",
        rule: "choose_one",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("choose_one");
  });

  it("rejects invalid activity_id for GET", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/votes?activity_id=not-an-object-id",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID);
  });

  it("returns votes list for admin", async () => {
    voteModelMock.countDocuments.mockResolvedValueOnce(1);
    voteModelMock.find.mockReturnValueOnce({
      limit: () => ({
        skip: () => ({
          sort: async () => [{ token: "vote-token" }],
        }),
      }),
    });

    const request = new NextRequest("http://localhost:3000/api/votes");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(1);
    expect(body.data.data).toEqual([{ token: "vote-token" }]);
  });

  it("creates vote for eligible user", async () => {
    createVoteMock.mockResolvedValueOnce({
      success: true,
      vote: { token: "new-vote-token" },
    });

    const request = new NextRequest("http://localhost:3000/api/votes", {
      method: "POST",
      body: JSON.stringify({
        activity_id: "507f1f77bcf86cd799439011",
        rule: "choose_one",
        choose_one: "507f1f77bcf86cd799439012",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.token).toBe("new-vote-token");
  });
});
