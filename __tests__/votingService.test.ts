jest.mock("mongoose", () => ({
  Types: {
    ObjectId: {
      isValid: (id: string) =>
        typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id),
    },
  },
}));

jest.mock("uuid", () => ({
  v4: () => "mock-vote-token",
}));

import {
  validateOptions,
  createVote,
  validateVotingEligibility,
} from "@/lib/votingService";
import { API_CONSTANTS } from "@/lib/constants";

jest.mock("@/lib/models/Activity", () => ({
  Activity: {
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock("@/lib/models/Option", () => ({
  Option: {
    find: jest.fn(),
  },
}));

jest.mock("@/lib/models/Vote", () => ({
  Vote: {
    create: jest.fn(),
  },
}));

const { Activity } = jest.requireMock("@/lib/models/Activity") as {
  Activity: { findById: jest.Mock; updateOne: jest.Mock };
};
const { Option } = jest.requireMock("@/lib/models/Option") as {
  Option: { find: jest.Mock };
};

describe("voting service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects empty option list", async () => {
    const result = await validateOptions("507f1f77bcf86cd799439011", []);

    expect(result.valid).toBe(false);
    expect(result.error).toBe(API_CONSTANTS.ERRORS.INVALID_OPTIONS);
    expect(result.statusCode).toBe(400);
  });

  it("rejects invalid option object id", async () => {
    const result = await validateOptions("507f1f77bcf86cd799439011", [
      "not-an-id",
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toBe(API_CONSTANTS.ERRORS.INVALID_OBJECT_ID);
    expect(result.statusCode).toBe(400);
  });

  it("rejects createVote when choose_one is missing", async () => {
    Activity.findById.mockResolvedValueOnce({
      _id: "507f1f77bcf86cd799439011",
      rule: "choose_one",
      users: [],
      open_from: new Date(Date.now() - 1000),
      open_to: new Date(Date.now() + 100000),
    });

    const result = await createVote({
      activity_id: "507f1f77bcf86cd799439011",
      rule: "choose_one",
      student_id: "111000111",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      `${API_CONSTANTS.ERRORS.MISSING_FIELD}: choose_one`,
    );
    expect(result.statusCode).toBe(400);
  });

  it("rejects createVote when choose_all is empty", async () => {
    Activity.findById.mockResolvedValueOnce({
      _id: "507f1f77bcf86cd799439011",
      rule: "choose_all",
      users: [],
      open_from: new Date(Date.now() - 1000),
      open_to: new Date(Date.now() + 100000),
    });

    const result = await createVote({
      activity_id: "507f1f77bcf86cd799439011",
      rule: "choose_all",
      choose_all: [],
      student_id: "111000111",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      `${API_CONSTANTS.ERRORS.MISSING_FIELD}: choose_all`,
    );
    expect(result.statusCode).toBe(400);
  });

  it("detects already voted user", async () => {
    const eligibility = await validateVotingEligibility(
      {
        _id: "507f1f77bcf86cd799439011",
        rule: "choose_one",
        users: ["111000111"],
        open_from: new Date(Date.now() - 1000),
        open_to: new Date(Date.now() + 100000),
      } as never,
      "111000111",
    );

    expect(eligibility.valid).toBe(false);
    expect(eligibility.error).toBe(API_CONSTANTS.ERRORS.VOTE_ALREADY_VOTED);
  });

  it("validates option ownership by activity", async () => {
    Option.find.mockResolvedValueOnce([
      {
        _id: "507f1f77bcf86cd799439012",
        activity_id: "507f1f77bcf86cd799439011",
      },
    ]);

    const result = await validateOptions("507f1f77bcf86cd799439011", [
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439013",
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toBe(API_CONSTANTS.ERRORS.INVALID_OPTIONS);
  });
});
