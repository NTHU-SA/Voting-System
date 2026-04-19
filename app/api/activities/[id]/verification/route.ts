import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  createSuccessResponse,
  validateObjectIdOrError,
  createInternalErrorResponse,
} from "@/lib/middleware";
import { Vote } from "@/lib/models/Vote";
import { Option } from "@/lib/models/Option";
import { Activity } from "@/lib/models/Activity";
import connectDB from "@/lib/db";

// GET /api/activities/[id]/verification - Get voted UUIDs for verification (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await requireAdminAuth(request);
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    await connectDB();

    const { id } = await params;

    const invalidIdResponse = validateObjectIdOrError(id);
    if (invalidIdResponse) {
      return invalidIdResponse;
    }

    const activity = await Activity.findById(id).select("name").lean();
    if (!activity) {
      return createSuccessResponse({
        activity_id: id,
        activity_name: "",
        total_votes: 0,
        voted_tokens: [],
      });
    }

    const options = await Option.find({ activity_id: id })
      .select("_id label candidate.name")
      .lean();
    const optionMap = new Map<string, string>();
    options.forEach((option) => {
      const displayName =
        option.label || option.candidate?.name || `選項 ${option._id.toString()}`;
      optionMap.set(option._id.toString(), displayName);
    });

    const votes = await Vote.find({ activity_id: id })
      .select("token created_at rule choose_one choose_all")
      .sort({ created_at: -1 })
      .lean();

    const votedTokens = votes.map((vote) => {
      if (vote.rule === "choose_one" && vote.choose_one) {
        const optionName =
          optionMap.get(vote.choose_one.toString()) || vote.choose_one.toString();
        return {
          uuid: vote.token,
          voted_at: vote.created_at,
          selections: [optionName],
        };
      }

      const selections = (vote.choose_all || []).map((choice) => {
        const optionName =
          optionMap.get(choice.option_id.toString()) || choice.option_id.toString();
        return `${optionName}（${choice.remark}）`;
      });

      return {
        uuid: vote.token,
        voted_at: vote.created_at,
        selections,
      };
    });

    return createSuccessResponse({
      activity_id: id,
      activity_name: activity.name,
      total_votes: votes.length,
      voted_tokens: votedTokens,
    });
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to get verification data",
      "Get verification error",
    );
  }
}
