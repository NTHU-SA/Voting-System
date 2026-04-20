/** @jest-environment node */

import { MongoServerError } from "mongodb";
import { NextResponse } from "next/server";
import { POST } from "@/app/api/activities/[id]/voters/route";
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
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));
jest.mock("@/lib/models/ActivityVoter", () => ({
  ActivityVoter: {
    deleteMany: jest.fn(),
    insertMany: jest.fn(),
    bulkWrite: jest.fn(),
  },
}));

const connectDBMock = jest.requireMock("@/lib/db") as jest.Mock;
const middlewareMock = jest.requireMock("@/lib/middleware") as {
  requireAdminAuth: jest.Mock;
};
const activityModelMock = (
  jest.requireMock("@/lib/models/Activity") as {
    Activity: {
      findById: jest.Mock;
      updateOne: jest.Mock;
    };
  }
).Activity;
const activityVoterModelMock = (
  jest.requireMock("@/lib/models/ActivityVoter") as {
    ActivityVoter: {
      deleteMany: jest.Mock;
      insertMany: jest.Mock;
      bulkWrite: jest.Mock;
    };
  }
).ActivityVoter;

const activityId = "507f1f77bcf86cd799439011";

function createMockRequest(csvContent: string) {
  const formData = new FormData();
  formData.append("file", new File([csvContent], "voters.csv", { type: "text/csv" }));

  return {
    formData: jest.fn().mockResolvedValue(formData),
  } as never;
}

function createDbMock(helloResponse: { setName?: string; msg?: string }) {
  const command = jest.fn().mockResolvedValue(helloResponse);
  const session = {
    withTransaction: jest.fn(async (callback: () => Promise<void>) => callback()),
    endSession: jest.fn().mockResolvedValue(undefined),
  };

  return {
    db: {
      connection: {
        db: {
          admin: () => ({ command }),
        },
      },
      startSession: jest.fn().mockResolvedValue(session),
    },
    command,
    session,
  };
}

describe("/api/activities/[id]/voters POST", () => {
  let mockedNow = 1_000_000_000_000;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedNow += 10 * 60 * 1000;
    jest.spyOn(Date, "now").mockReturnValue(mockedNow);

    middlewareMock.requireAdminAuth.mockResolvedValue({
      student_id: "111000001",
    });
    activityModelMock.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: activityId }),
    });
    activityModelMock.updateOne.mockResolvedValue({ acknowledged: true });
    activityVoterModelMock.deleteMany.mockResolvedValue({ acknowledged: true });
    activityVoterModelMock.insertMany.mockResolvedValue([]);
    activityVoterModelMock.bulkWrite.mockResolvedValue({ acknowledged: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses transaction path when Mongo topology supports transactions", async () => {
    const { db, command, session } = createDbMock({ setName: "rs0" });
    connectDBMock.mockResolvedValue(db);

    const response = await POST(createMockRequest("student_id\n111000001\n"), {
      params: Promise.resolve({ id: activityId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(command).toHaveBeenCalledTimes(1);
    expect(db.startSession).toHaveBeenCalledTimes(1);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(activityVoterModelMock.insertMany).toHaveBeenCalledTimes(1);
    expect(activityVoterModelMock.bulkWrite).not.toHaveBeenCalled();
  });

  it("uses non-transactional replacement when transactions are not supported", async () => {
    const { db, command } = createDbMock({});
    connectDBMock.mockResolvedValue(db);

    const response = await POST(createMockRequest("student_id\n111000001\n111000002\n"), {
      params: Promise.resolve({ id: activityId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(command).toHaveBeenCalledTimes(1);
    expect(db.startSession).not.toHaveBeenCalled();
    expect(activityVoterModelMock.bulkWrite).toHaveBeenCalledTimes(1);
    expect(activityVoterModelMock.insertMany).not.toHaveBeenCalled();
    expect(activityVoterModelMock.deleteMany).toHaveBeenCalledWith({
      activity_id: activityId,
      student_id: { $nin: ["111000001", "111000002"] },
    });
  });

  it("falls back to non-transactional replacement when transaction is unsupported at runtime", async () => {
    const { db, session } = createDbMock({ setName: "rs0" });
    session.withTransaction.mockRejectedValueOnce(
      new MongoServerError({
        message:
          "Transaction numbers are only allowed on a replica set member or mongos",
      }),
    );
    connectDBMock.mockResolvedValue(db);

    const response = await POST(createMockRequest("student_id\n111000001\n"), {
      params: Promise.resolve({ id: activityId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.startSession).toHaveBeenCalledTimes(1);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(activityVoterModelMock.bulkWrite).toHaveBeenCalledTimes(1);
  });
});
