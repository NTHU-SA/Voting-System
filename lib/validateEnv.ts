const OAUTH_LOGIN_ENV_VARS = [
  "OAUTH_CLIENT_ID",
  "OAUTH_CALLBACK_URL",
  "OAUTH_SCOPE",
  "OAUTH_AUTHORIZE",
  "TOKEN_SECRET",
] as const;

const OAUTH_CALLBACK_ENV_VARS = [
  "OAUTH_CLIENT_ID",
  "OAUTH_CLIENT_SECRET",
  "OAUTH_CALLBACK_URL",
  "OAUTH_TOKEN_URL",
  "OAUTH_RESOURCE_URL",
  "TOKEN_SECRET",
] as const;

export function getMissingEnvVars(requiredVars: readonly string[]): string[] {
  return requiredVars.filter((name) => !process.env[name]);
}

export function assertRequiredEnvVars(
  requiredVars: readonly string[],
  context: string,
): void {
  const missingVars = getMissingEnvVars(requiredVars);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for ${context}: ${missingVars.join(", ")}`,
    );
  }
}

export function validateLoginEnv(): void {
  assertRequiredEnvVars(OAUTH_LOGIN_ENV_VARS, "OAuth login");
}

export function validateOAuthCallbackEnv(): void {
  assertRequiredEnvVars(OAUTH_CALLBACK_ENV_VARS, "OAuth callback");
}
