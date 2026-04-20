/** @jest-environment node */

import { NextResponse } from "next/server";
import { PUT } from "@/app/api/activities/[id]/route";
import { API_CONSTANTS } from "@/lib/constants";

jest.mock("@/lib/db", () => jest.fn());
jest.mock("@/lib/middleware", () => ({
  requireAdminAuth: jest.fn(),
  validateObjectIdOrError: (id: string) => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: API_CONSTANTS.ERRORS.INVALID_OBJECT_ID },
        { status: 400 },
      );
    }
    return null;
  },
  createInternalErrorResponse: (error: unknown, fallbackMessage: string) =>
    NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : fallbackMessage,
      },
      { status: 500 },
    ),
  createErrorResponse: (message: string, status = 400) =>
    NextResponse.json({ success: false, error: message }, { status }),
  createSuccessResponse: (data: unknown, status = 200) =>
    NextResponse.json({ success: true, data }, { status }),
}));
jest.mock("@/lib/models/Activity", () => ({
  Activity: {
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock("@/lib/models/Option", () => ({
  Option: {},
}));

const connectDBMock = jest.requireMock("@/lib/db") as jest.Mock;
const middlewareMock = jest.requireMock("@/lib/middleware") as {
  requireAdminAuth: jest.Mock;
};
const activityModelMock = (
  jest.requireMock("@/lib/models/Activity") as {
    Activity: {
      findByIdAndUpdate: jest.Mock;
    };
  }
).Activity;

const activityId = "507f1f77bcf86cd799439011";

function createRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as never;
}

describe("/api/activities/[id] PUT", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectDBMock.mockResolvedValue({});
    middlewareMock.requireAdminAuth.mockResolvedValue({
      student_id: "111000001",
    });
    activityModelMock.findByIdAndUpdate.mockResolvedValue({
      _id: activityId,
      name: "Updated Activity",
    });
  });

  it("updates activity with partial payload", async () => {
    const response = await PUT(createRequest({ name: "Updated Activity" }), {
      params: Promise.resolve({ id: activityId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(activityModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      activityId,
      expect.objectContaining({
        name: "Updated Activity",
        updated_at: expect.any(Date),
      }),
      {
        new: true,
        runValidators: true,
      },
    );
  });

  it("returns 400 when rule is invalid", async () => {
    const response = await PUT(createRequest({ rule: "invalid_rule" }), {
      params: Promise.resolve({ id: activityId }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe(API_CONSTANTS.ERRORS.INVALID_RULE);
    expect(activityModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when date range is invalid", async () => {
    const response = await PUT(
      createRequest({
        open_from: "2026-01-02T00:00:00.000Z",
        open_to: "2026-01-01T00:00:00.000Z",
      }),
      {
        params: Promise.resolve({ id: activityId }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(activityModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
