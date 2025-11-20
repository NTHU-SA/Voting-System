import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { Activity, AdminActivity } from "@/types";
import { getActivityStatus } from "@/lib/activities";

type ActivityType = Activity | AdminActivity;

interface ActivityStatusBadgeProps {
  activity: ActivityType;
}

/**
 * ActivityStatusBadge component
 * Displays a badge showing the current status of an activity (upcoming, active, or ended)
 */
export function ActivityStatusBadge({ activity }: ActivityStatusBadgeProps) {
  const status = getActivityStatus(activity);

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
}
