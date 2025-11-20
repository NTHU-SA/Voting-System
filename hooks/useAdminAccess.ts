import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface UseAdminAccessReturn {
  isAdmin: boolean;
  loading: boolean;
  checkingAccess: boolean;
}

/**
 * Custom hook to verify admin access and redirect if unauthorized
 * Automatically checks admin access on mount and redirects non-admins
 */
export function useAdminAccess(
  onAccessGranted?: () => void
): UseAdminAccessReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const router = useRouter();
  const callbackRef = useRef(onAccessGranted);

  useEffect(() => {
    callbackRef.current = onAccessGranted;
  }, [onAccessGranted]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setCheckingAccess(true);
        const response = await fetch("/api/auth/check");
        const data = await response.json();

        if (!data.authenticated || !data.user?.isAdmin) {
          // Not authenticated or not an admin, redirect to home
          router.push("/?error=admin_required");
          return;
        }

        setIsAdmin(true);
        setLoading(false);
        
        // Call the callback if access is granted
        if (callbackRef.current) {
          callbackRef.current();
        }
      } catch (err) {
        console.error("Error checking admin access:", err);
        router.push("/?error=auth_failed");
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  return {
    isAdmin,
    loading,
    checkingAccess,
  };
}
