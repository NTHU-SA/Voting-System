/**
 * API Route Configuration
 *
 * This configuration is used by Next.js API routes to set up
 * request parsing and security settings.
 */

export const API_CONFIG = {
  // Request body size limit (1MB for security)
  bodyParser: {
    sizeLimit: "1mb",
  },
} as const;

/**
 * Export for use in API routes
 *
 * Usage in route.ts:
 * export const config = API_CONFIG;
 */
