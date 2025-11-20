import { Activity } from "@/lib/activities";
import { AdminActivity } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

type ActivityType = Activity | AdminActivity;

/**
 * Determines the status of an activity based on current time
 */
export function getActivityStatusType(activity: ActivityType): "upcoming" | "active" | "ended" {
  const now = new Date();
  const openFrom = new Date(activity.open_from);
  const openTo = new Date(activity.open_to);

  if (now < openFrom) {
    return "upcoming";
  } else if (now > openTo) {
    return "ended";
  } else {
    return "active";
  }
}

/**
 * Returns a Badge component with the appropriate status for an activity
 */
export function useActivityStatusBadge() {
  const getStatusBadge = (activity: ActivityType) => {
    const status = getActivityStatusType(activity);

    switch (status) {
      case "upcoming":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            即將開始
          </Badge>
        );
      case "ended":
        return <Badge variant="secondary">已結束</Badge>;
      case "active":
        return (
          <Badge
            variant="success"
            className="gap-1 bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-800"
          >
            <CheckCircle className="h-3 w-3 text-green-600" />
            進行中
          </Badge>
        );
    }
  };

  return { getStatusBadge, getActivityStatusType };
}
