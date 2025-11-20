import { useEffect, useState } from "react";
import { AdminActivity } from "@/types";

interface UseAdminActivitiesReturn {
  activities: AdminActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch all activities for admin dashboard
 * Fetches all activities with options count
 */
export function useAdminActivities(): UseAdminActivitiesReturn {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/activities");
      const data = await response.json();

      if (data.success) {
        setActivities(data.data);
      } else {
        setError(data.error || "無法載入投票活動");
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("載入投票活動時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
}
