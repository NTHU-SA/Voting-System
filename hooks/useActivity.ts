import { useEffect, useState, useCallback } from "react";
import { ActivityWithOptions } from "@/types";
import { fetchActivity } from "@/lib/activities";

interface UseActivityReturn {
  activity: ActivityWithOptions | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch a single activity with its options
 * @param activityId - The ID of the activity to fetch
 * @param includeOptions - Whether to include options in the response (default: true)
 */
export function useActivity(
  activityId: string,
  includeOptions: boolean = true
): UseActivityReturn {
  const [activity, setActivity] = useState<ActivityWithOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityData = useCallback(async () => {
    if (!activityId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const activityData = await fetchActivity(activityId, includeOptions);
      setActivity(activityData);
    } catch (err) {
      console.error("Error fetching activity:", err);
      setError("載入投票活動時發生錯誤");
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [activityId, includeOptions]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  return {
    activity,
    loading,
    error,
    refetch: fetchActivityData,
  };
}
