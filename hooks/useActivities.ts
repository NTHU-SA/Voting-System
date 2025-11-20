import { useEffect, useState } from "react";
import { Activity } from "@/types";
import { fetchActiveActivities } from "@/lib/activities";

interface UseActivitiesReturn {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage active activities
 * Uses the activities library to fetch currently active voting activities
 */
export function useActivities(): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivitiesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeActivities = await fetchActiveActivities();
      setActivities(activeActivities);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("載入投票活動時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivitiesData();
  }, []);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivitiesData,
  };
}
