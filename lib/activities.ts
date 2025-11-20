// Activity fetching and filtering utilities
import { Activity, ActivityWithOptions, AdminActivity } from "@/types";

/**
 * Check if an activity is currently active (within its time window)
 */
export function isActivityActive(activity: Activity): boolean {
  const now = new Date();
  const openFrom = new Date(activity.open_from);
  const openTo = new Date(activity.open_to);
  return now >= openFrom && now <= openTo;
}

/**
 * Fetch all activities from the API
 */
export async function fetchActivities(): Promise<Activity[]> {
  const response = await fetch("/api/activities");
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "無法載入投票活動");
  }

  return data.data;
}

/**
 * Fetch all active activities (within time window)
 */
export async function fetchActiveActivities(): Promise<Activity[]> {
  const activities = await fetchActivities();
  return activities.filter(isActivityActive);
}

/**
 * Fetch a specific activity by ID
 */
export async function fetchActivity(
  activityId: string,
  includeOptions: boolean = false,
): Promise<ActivityWithOptions> {
  const params = includeOptions ? "?include_options=true" : "";
  const response = await fetch(`/api/activities/${activityId}${params}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "無法載入投票活動");
  }

  return data.data;
}

/**
 * Get activity status badge text
 */
export function getActivityStatus(
  activity: Activity | AdminActivity,
): "upcoming" | "active" | "ended" {
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
