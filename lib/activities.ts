// Activity fetching and filtering utilities
import { IActivity, IOption, ICandidate } from "@/types";

// Client-side Activity type (serialized from database)
export interface Activity extends Omit<IActivity, "_id" | "options" | "open_from" | "open_to" | "created_at" | "updated_at"> {
  _id: string;
  subtitle?: string; // Additional client field
  open_from: string;
  open_to: string;
}

export interface ActivityWithOptions extends Activity {
  options: Option[];
}

// Client-side Option type (serialized from database)
export type Option = Omit<IOption, "_id" | "activity_id" | "created_at" | "updated_at"> & {
  _id: string;
};

// Re-export Candidate from types
export type Candidate = ICandidate;

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
  activity: Activity,
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
