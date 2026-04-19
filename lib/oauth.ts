import axios from "axios";
import crypto from "crypto";
import { getRequiredEnvVar } from "./config";
import { OAuthTokenResponse, OAuthUserInfo } from "@/types";

const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

interface OAuthStatePayload {
  redirect: string;
  iat: number;
}

function sanitizeRedirectPath(redirect: string): string {
  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/vote";
  }

  return redirect;
}

function signStatePayload(payloadBase64Url: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadBase64Url)
    .digest("base64url");
}

function isSignatureValid(signature: string, expectedSignature: string): boolean {
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createOAuthState(redirect: string): string {
  const TOKEN_SECRET = getRequiredEnvVar("TOKEN_SECRET");

  const payload: OAuthStatePayload = {
    redirect: sanitizeRedirectPath(redirect),
    iat: Math.floor(Date.now() / 1000),
  };

  const payloadBase64Url = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const signature = signStatePayload(payloadBase64Url, TOKEN_SECRET);

  return `${payloadBase64Url}.${signature}`;
}

export function parseOAuthState(state: string): string | null {
  const TOKEN_SECRET = getRequiredEnvVar("TOKEN_SECRET");
  const [payloadBase64Url, signature] = state.split(".");

  if (!payloadBase64Url || !signature) {
    return null;
  }

  const expectedSignature = signStatePayload(payloadBase64Url, TOKEN_SECRET);
  if (!isSignatureValid(signature, expectedSignature)) {
    return null;
  }

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(
      Buffer.from(payloadBase64Url, "base64url").toString("utf-8")
    ) as OAuthStatePayload;
  } catch {
    return null;
  }

  if (
    !payload.redirect ||
    typeof payload.redirect !== "string" ||
    !payload.iat ||
    typeof payload.iat !== "number"
  ) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.iat > now + 60 || now - payload.iat > OAUTH_STATE_MAX_AGE_SECONDS) {
    return null;
  }

  return sanitizeRedirectPath(payload.redirect);
}

export function getAuthorizationURL(redirect?: string): string {
  const OAUTH_CLIENT_ID = getRequiredEnvVar("OAUTH_CLIENT_ID");
  const OAUTH_CALLBACK_URL = getRequiredEnvVar("OAUTH_CALLBACK_URL");
  const OAUTH_SCOPE = getRequiredEnvVar("OAUTH_SCOPE");
  const OAUTH_AUTHORIZE = getRequiredEnvVar("OAUTH_AUTHORIZE");

  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    response_type: "code",
    redirect_uri: OAUTH_CALLBACK_URL,
    scope: OAUTH_SCOPE,
  });

  // Always include signed state to prevent OAuth callback CSRF/login bypass
  const state = createOAuthState(redirect ?? "/vote");
  params.set("state", state);

  return `${OAUTH_AUTHORIZE}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
): Promise<OAuthTokenResponse> {
  try {
    const OAUTH_CLIENT_ID = getRequiredEnvVar("OAUTH_CLIENT_ID");
    const OAUTH_CLIENT_SECRET = getRequiredEnvVar("OAUTH_CLIENT_SECRET");
    const OAUTH_CALLBACK_URL = getRequiredEnvVar("OAUTH_CALLBACK_URL");
    const OAUTH_TOKEN_URL = getRequiredEnvVar("OAUTH_TOKEN_URL");

    const response = await axios.post(OAUTH_TOKEN_URL, {
      grant_type: "authorization_code",
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
      redirect_uri: OAUTH_CALLBACK_URL, // Should NOT be encoded - must match authorization request
      code,
    });

    return response.data;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to exchange code for token";
    console.error("OAuth token exchange error:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  try {
    const OAUTH_RESOURCE_URL = getRequiredEnvVar("OAUTH_RESOURCE_URL");

    const response = await axios.post(
      OAUTH_RESOURCE_URL,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    return response.data;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get user info";
    console.error("OAuth get user info error:", errorMessage);
    throw new Error(errorMessage);
  }
}
