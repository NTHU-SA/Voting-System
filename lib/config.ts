/**
 * Centralized configuration module for environment variables and application settings
 */

/**
 * Check if the application is running in development mode
 * For client-side components, check NEXT_PUBLIC_NODE_ENV or fallback to NODE_ENV
 */
export function isDevelopment(): boolean {
  // For client-side
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_NODE_ENV === "development" || 
           process.env.NODE_ENV === "development";
  }
  // For server-side
  return process.env.NODE_ENV === "development";
}

/**
 * Check if the application is running in production mode
 */
export function isProduction(): boolean {
  // For client-side
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_NODE_ENV === "production" || 
           process.env.NODE_ENV === "production";
  }
  // For server-side
  return process.env.NODE_ENV === "production";
}

/**
 * Get the application port
 */
export function getPort(): number {
  return parseInt(process.env.PORT || "3000", 10);
}

/**
 * Get the external hostname for the application (e.g., voting.nthusa.tw or localhost:3000)
 * This is the hostname used for building URLs, not the bind address
 */
export function getAppHostname(): string {
  return process.env.APP_HOSTNAME || `localhost:${getPort()}`;
}

/**
 * Get the base URL for the application
 * Used for constructing absolute URLs (e.g., OAuth callbacks)
 */
export function getBaseURL(): string {
  // Use NEXT_PUBLIC_BASE_URL if available (for client-side)
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Use APP_HOSTNAME env var or construct from protocol + hostname
  const protocol = isProduction() ? "https" : "http";
  const hostname = getAppHostname();
  
  return `${protocol}://${hostname}`;
}

/**
 * Get required environment variable or throw error
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required but not set`);
  }
  return value;
}
