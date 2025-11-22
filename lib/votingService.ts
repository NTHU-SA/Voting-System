import { Activity } from "@/lib/models/Activity";
import { Option } from "@/lib/models/Option";
import { Vote } from "@/lib/models/Vote";
import { IChoiceAll, IActivity } from "@/types";
import { isValidRemark } from "@/lib/validation";
import { API_CONSTANTS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

interface VoteValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

interface CreateVoteParams {
  activity_id: string;
  rule: "choose_all" | "choose_one";
  choose_all?: IChoiceAll[];
  choose_one?: string;
  student_id: string;
}

/**
 * Validates vote remarks for choose_all rule
 */
export function validateVoteRemarks(
  choose_all: IChoiceAll[]
): VoteValidationResult {
  const allValid = choose_all.every((choice) => isValidRemark(choice.remark));

  if (!allValid) {
    return {
      valid: false,
      error: API_CONSTANTS.ERRORS.INVALID_REMARK,
      statusCode: 400,
    };
  }

  return { valid: true };
}

/**
 * Validates that all options belong to the activity
 */
export async function validateOptions(
  activity_id: string,
  optionIds: string[]
): Promise<VoteValidationResult> {
  const options = await Option.find({
    _id: { $in: optionIds },
    activity_id,
  });

  if (options.length !== optionIds.length) {
    return {
      valid: false,
      error: API_CONSTANTS.ERRORS.INVALID_OPTIONS,
      statusCode: 400,
    };
  }

  return { valid: true };
}

/**
 * Validates user's eligibility to vote
 */
export async function validateVotingEligibility(
  activity: IActivity,
  student_id: string
): Promise<VoteValidationResult> {
  // Check if user already voted
  if (activity.users.includes(student_id)) {
    return {
      valid: false,
      error: API_CONSTANTS.ERRORS.VOTE_ALREADY_VOTED,
      statusCode: 400,
    };
  }

  // Check activity time window
  const now = new Date();
  if (now < activity.open_from) {
    return {
      valid: false,
      error: API_CONSTANTS.ERRORS.VOTE_NOT_STARTED,
      statusCode: 400,
    };
  }

  if (now > activity.open_to) {
    return {
      valid: false,
      error: API_CONSTANTS.ERRORS.VOTE_ENDED,
      statusCode: 400,
    };
  }

  return { valid: true };
}

/**
 * Creates a vote with proper anonymization
 */
export async function createVote(params: CreateVoteParams): Promise<{
  success: boolean;
  vote?: Record<string, unknown>;
  error?: string;
  statusCode?: number;
}> {
  const { activity_id, rule, choose_all, choose_one, student_id } = params;

  try {
    // Get activity
    const activity = await Activity.findById(activity_id);
    if (!activity) {
      return {
        success: false,
        error: API_CONSTANTS.ERRORS.ACTIVITY_NOT_FOUND,
        statusCode: 404,
      };
    }

    // Validate rule matches activity
    if (activity.rule !== rule) {
      return {
        success: false,
        error: API_CONSTANTS.ERRORS.RULE_MISMATCH,
        statusCode: 400,
      };
    }

    // Validate voting eligibility
    const eligibilityCheck = await validateVotingEligibility(
      activity,
      student_id
    );
    if (!eligibilityCheck.valid) {
      return {
        success: false,
        error: eligibilityCheck.error,
        statusCode: eligibilityCheck.statusCode,
      };
    }

    // Get option IDs and validate
    const optionIds =
      rule === "choose_all"
        ? (choose_all || []).map((c) => c.option_id.toString())
        : [choose_one || ""];

    const optionValidation = await validateOptions(activity_id, optionIds);
    if (!optionValidation.valid) {
      return {
        success: false,
        error: optionValidation.error,
        statusCode: optionValidation.statusCode,
      };
    }

    // Validate remarks for choose_all
    if (rule === "choose_all" && choose_all) {
      const remarkValidation = validateVoteRemarks(choose_all);
      if (!remarkValidation.valid) {
        return {
          success: false,
          error: remarkValidation.error,
          statusCode: remarkValidation.statusCode,
        };
      }
    }

    // Create vote with UUID token for anonymity
    const token = uuidv4();
    const voteData: Record<string, unknown> = {
      activity_id,
      rule,
      token,
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (rule === "choose_all") {
      voteData.choose_all = choose_all;
    } else {
      voteData.choose_one = choose_one;
    }

    const vote = await Vote.create(voteData as Omit<IVote, "_id">);

    // Add student_id to activity's voted users list
    await Activity.updateOne(
      { _id: activity_id },
      { $addToSet: { users: student_id } }
    );

    return {
      success: true,
      vote: JSON.parse(JSON.stringify(vote)), // 序列化後自動轉換 ObjectId
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create vote";
    return { success: false, error: errorMessage, statusCode: 500 };
  }
}
