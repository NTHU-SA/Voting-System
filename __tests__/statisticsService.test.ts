import { calculateActivityStatistics } from "@/lib/statisticsService";

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

jest.mock("@/lib/models/Vote", () => ({
  Vote: {
    find: jest.fn(),
  },
}));

const { Activity } = jest.requireMock("@/lib/models/Activity") as {
  Activity: { findById: jest.Mock };
};
const { Option } = jest.requireMock("@/lib/models/Option") as {
  Option: { find: jest.Mock };
};
const { Vote } = jest.requireMock("@/lib/models/Vote") as {
  Vote: { find: jest.Mock };
};

const ACTIVITY_ID = "507f1f77bcf86cd799439011";
const OPTION_A = "507f1f77bcf86cd799439021";
const OPTION_B = "507f1f77bcf86cd799439022";

function mockActivity(overrides: Record<string, unknown> = {}) {
  Activity.findById.mockReturnValue({
    populate: jest.fn().mockResolvedValue({
      _id: ACTIVITY_ID,
      name: "測試選舉",
      type: "election",
      rule: "choose_one",
      users: [],
      eligible_voters_count: 0,
      open_from: new Date("2026-01-01"),
      open_to: new Date("2026-12-31"),
      ...overrides,
    }),
  });
}

function mockOptions() {
  Option.find.mockResolvedValue([
    { _id: OPTION_A, candidate: { name: "王小明" } },
    { _id: OPTION_B, candidate: { name: "陳大文" } },
  ]);
}

describe("statistics service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the eligible voter roster as the turnout denominator", async () => {
    mockActivity({
      eligible_voters_count: 500,
      users: ["A", "B", "C", "D", "E"],
    });
    mockOptions();
    Vote.find.mockResolvedValue([
      { choose_one: OPTION_A },
      { choose_one: OPTION_A },
      { choose_one: OPTION_B },
      { choose_one: OPTION_B },
      { choose_one: OPTION_B },
    ]);

    const result = await calculateActivityStatistics(ACTIVITY_ID);

    expect(result.success).toBe(true);
    // 5 票 / 500 名冊人數 = 1.00%，而不是 5/5 = 100%
    expect(result.data?.statistics.totalEligibleVoters).toBe(500);
    expect(result.data?.statistics.totalVotes).toBe(5);
    expect(result.data?.statistics.turnoutRate).toBe("1.00");
  });

  it("returns zero turnout when no voter roster has been uploaded", async () => {
    mockActivity({ eligible_voters_count: 0, users: [] });
    mockOptions();
    Vote.find.mockResolvedValue([]);

    const result = await calculateActivityStatistics(ACTIVITY_ID);

    expect(result.success).toBe(true);
    expect(result.data?.statistics.totalEligibleVoters).toBe(0);
    expect(result.data?.statistics.turnoutRate).toBe("0");
  });

  it("counts choose_one votes per option", async () => {
    mockActivity({ eligible_voters_count: 10 });
    mockOptions();
    Vote.find.mockResolvedValue([
      { choose_one: OPTION_A },
      { choose_one: OPTION_B },
      { choose_one: OPTION_B },
    ]);

    const result = await calculateActivityStatistics(ACTIVITY_ID);

    const stats = result.data?.statistics.optionStats ?? [];
    expect(stats.find((s) => s.option_id === OPTION_A)?.total).toBe(1);
    expect(stats.find((s) => s.option_id === OPTION_B)?.total).toBe(2);
    expect(result.data?.statistics.turnoutRate).toBe("30.00");
  });

  it("returns 404 when the activity does not exist", async () => {
    Activity.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const result = await calculateActivityStatistics(ACTIVITY_ID);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });
});
