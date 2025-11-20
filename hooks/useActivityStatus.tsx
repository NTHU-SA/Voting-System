import { getActivityStatus } from "@/lib/activities";

/**
 * Custom hook that provides activity status utilities
 * Re-exports getActivityStatus from lib for use in components
 */
export function useActivityStatusBadge() {
  return { getActivityStatus };
}

// Also export for direct use
export { getActivityStatus };
