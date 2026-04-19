import { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  createInternalErrorResponse,
} from "@/lib/middleware";
import connectDB from "@/lib/db";
import { Vote } from "@/lib/models/Vote";
import { Activity } from "@/lib/models/Activity";
import { Option } from "@/lib/models/Option";

// GET /api/verify/[token] - Public UUID verification
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    await connectDB();

    const { token } = await params;
    if (!token?.trim()) {
      return createErrorResponse("UUID is required", 400);
    }

    const vote = await Vote.findOne({ token: token.trim() }).lean();
    if (!vote) {
      return createErrorResponse("找不到此 UUID 的投票記錄", 404);
    }

    const activity = await Activity.findById(vote.activity_id)
      .select("name")
      .lean();
    const options = await Option.find({ activity_id: vote.activity_id })
      .select("_id label candidate.name")
      .lean();

    const optionMap = new Map<string, string>();
    options.forEach((option) => {
      optionMap.set(
        option._id.toString(),
        option.label || option.candidate?.name || option._id.toString(),
      );
    });

    const selections =
      vote.rule === "choose_one"
        ? [
            optionMap.get(vote.choose_one?.toString() || "") ||
              vote.choose_one?.toString() ||
              "",
          ].filter(Boolean)
        : (vote.choose_all || []).map((choice) => {
            const optionName =
              optionMap.get(choice.option_id.toString()) ||
              choice.option_id.toString();
            return `${optionName}（${choice.remark}）`;
          });

    return createSuccessResponse({
      uuid: vote.token,
      activity_id: vote.activity_id,
      activity_name: activity?.name || "未知活動",
      voted_at: vote.created_at,
      rule: vote.rule,
      selections,
    });
  } catch (error: unknown) {
    return createInternalErrorResponse(
      error,
      "Failed to verify vote",
      "Verify vote error",
    );
  }
}
