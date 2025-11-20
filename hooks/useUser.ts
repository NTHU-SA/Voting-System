import { useEffect, useState, useCallback } from "react";
import { UserData } from "@/types";

interface UseUserReturn {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage current user data
 * Fetches user information from the authentication check endpoint
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/check", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser({
            student_id: data.user.student_id,
            name: data.user.name,
            isAdmin: data.user.isAdmin,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to fetch user data");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    user,
    loading,
    error,
    refetch: fetchUserData,
  };
}
