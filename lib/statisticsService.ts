import { Activity } from "@/lib/models/Activity";
import { Option } from "@/lib/models/Option";
import { Vote } from "@/lib/models/Vote";
import { Document, Types } from "mongoose";

interface OptionStat {
  option_id: string;
  name: string;
  support: number;
  oppose: number;
  neutral: number;
  total: number;
}

interface Statistics {
  totalVotes: number;
  totalEligibleVoters: number;
  turnoutRate: string;
  optionStats: OptionStat[];
}

interface ActivityData {
  id: Types.ObjectId;
  name: string;
  type: string;
  rule: string;
  open_from: Date;
  open_to: Date;
}

interface OptionDocument extends Document {
  _id: Types.ObjectId;
  candidate?: {
    name?: string;
  };
}

interface VoteDocument extends Document {
  choose_all?: Array<{
    option_id: Types.ObjectId | string;
    remark: string;
  }>;
  choose_one?: Types.ObjectId | string;
}

interface ActivityDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  type: string;
  rule: string;
  users: string[];
  open_from: Date;
  open_to: Date;
}

/**
 * Calculate statistics for a voting activity
 */
export async function calculateActivityStatistics(
  activity_id: string,
): Promise<{
  success: boolean;
  data?: {
    activity: ActivityData;
    statistics: Statistics;
  };
  error?: string;
  statusCode?: number;
}> {
  try {
    // Get activity with populated options
    const activity = (await Activity.findById(activity_id).populate(
      "options",
    )) as ActivityDocument | null;
    if (!activity) {
      return {
        success: false,
        error: "Activity not found",
        statusCode: 404,
      };
    }

    // Get all votes for this activity
    const votes = (await Vote.find({ activity_id })) as VoteDocument[];

    // Calculate basic statistics
    const totalVotes = votes.length;
    const totalEligibleVoters = activity.users.length;
    const turnoutRate =
      totalEligibleVoters > 0
        ? ((totalVotes / totalEligibleVoters) * 100).toFixed(2)
        : "0";

    // Initialize stats for all options
    const options = (await Option.find({ activity_id })) as OptionDocument[];
    const optionStatsMap = initializeOptionStats(options);

    // Count votes based on activity rule
    if (activity.rule === "choose_all") {
      countChooseAllVotes(votes, optionStatsMap);
    } else if (activity.rule === "choose_one") {
      countChooseOneVotes(votes, optionStatsMap);
    }

    return {
      success: true,
      data: {
        activity: {
          id: activity._id,
          name: activity.name,
          type: activity.type,
          rule: activity.rule,
          open_from: activity.open_from,
          open_to: activity.open_to,
        },
        statistics: {
          totalVotes,
          totalEligibleVoters,
          turnoutRate,
          optionStats: Object.values(optionStatsMap),
        },
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to calculate statistics";
    return { success: false, error: errorMessage, statusCode: 500 };
  }
}

/**
 * Initialize option statistics map
 */
function initializeOptionStats(
  options: OptionDocument[],
): Record<string, OptionStat> {
  const statsMap: Record<string, OptionStat> = {};

  options.forEach((option) => {
    const optionId = option._id.toString();
    const candidateName = option.candidate?.name || "Unknown";

    statsMap[optionId] = {
      option_id: optionId,
      name: candidateName,
      support: 0,
      oppose: 0,
      neutral: 0,
      total: 0,
    };
  });

  return statsMap;
}

/**
 * Count votes for choose_all rule
 */
function countChooseAllVotes(
  votes: VoteDocument[],
  optionStatsMap: Record<string, OptionStat>,
): void {
  votes.forEach((vote) => {
    vote.choose_all?.forEach((choice) => {
      const optionId = choice.option_id.toString();
      const stats = optionStatsMap[optionId];

      if (stats) {
        stats.total++;

        switch (choice.remark) {
          case "我要投給他":
            stats.support++;
            break;
          case "我不投給他":
            stats.oppose++;
            break;
          case "我沒有意見":
            stats.neutral++;
            break;
        }
      }
    });
  });
}

/**
 * Count votes for choose_one rule
 */
function countChooseOneVotes(
  votes: VoteDocument[],
  optionStatsMap: Record<string, OptionStat>,
): void {
  votes.forEach((vote) => {
    if (vote.choose_one) {
      const optionId = vote.choose_one.toString();
      const stats = optionStatsMap[optionId];

      if (stats) {
        stats.support++;
        stats.total++;
      }
    }
  });
}
