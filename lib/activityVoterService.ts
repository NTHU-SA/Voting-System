import { ActivityVoter } from "@/lib/models/ActivityVoter";

export async function getEligibleVotersCount(activityId: string): Promise<number> {
  return ActivityVoter.countDocuments({ activity_id: activityId });
}
