import { useEffect, useState, useCallback } from "react";
import { Activity, Option } from "@/types";

// Extend Activity to include options array with full Option details
interface ActivityWithFullOptions extends Omit<Activity, "options"> {
  options: Option[];
}

interface UseAdminActivityReturn {
  activity: ActivityWithFullOptions | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch a single activity with full option details for admin
 * @param activityId - The ID of the activity to fetch
 */
export function useAdminActivity(activityId: string): UseAdminActivityReturn {
  const [activity, setActivity] = useState<ActivityWithFullOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!activityId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/activities/${activityId}?include_options=true`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();

      if (data.success) {
        setActivity(data.data);
      } else {
        setError(data.error || "無法載入活動資訊");
        setActivity(null);
      }
    } catch (err) {
      console.error("Error fetching activity:", err);
      setError("載入活動時發生錯誤");
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    activity,
    loading,
    error,
    refetch: fetchActivity,
  };
}
