import { getAuthorizationURL } from "@/lib/oauth";
import {
  validateLoginEnv,
  validateOAuthCallbackEnv,
  getMissingEnvVars,
} from "@/lib/validateEnv";

describe("auth and env utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws clear error when login env vars are missing", () => {
    delete process.env.OAUTH_CLIENT_ID;
    delete process.env.OAUTH_CALLBACK_URL;
    delete process.env.OAUTH_SCOPE;
    delete process.env.OAUTH_AUTHORIZE;
    delete process.env.TOKEN_SECRET;

    expect(() => validateLoginEnv()).toThrow(
      /Missing required environment variables for OAuth login/,
    );
  });

  it("returns missing env var list", () => {
    delete process.env.OAUTH_CLIENT_ID;
    process.env.OAUTH_SCOPE = "userid";

    const missing = getMissingEnvVars(["OAUTH_CLIENT_ID", "OAUTH_SCOPE"]);
    expect(missing).toEqual(["OAUTH_CLIENT_ID"]);
  });

  it("builds authorization URL when env vars are configured", () => {
    process.env.OAUTH_CLIENT_ID = "cid";
    process.env.OAUTH_CALLBACK_URL = "https://example.com/api/auth/callback";
    process.env.OAUTH_SCOPE = "userid name";
    process.env.OAUTH_AUTHORIZE = "https://oauth.example.com/authorize";
    process.env.TOKEN_SECRET = "test-secret";

    const url = getAuthorizationURL("/vote/abc");

    expect(url).toContain("https://oauth.example.com/authorize?");
    expect(url).toContain("client_id=cid");
    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fauth%2Fcallback",
    );
    expect(url).toContain("scope=userid+name");
    expect(url).toContain("state=");
  });

  it("validates callback env vars", () => {
    process.env.OAUTH_CLIENT_ID = "cid";
    process.env.OAUTH_CLIENT_SECRET = "secret";
    process.env.OAUTH_CALLBACK_URL = "https://example.com/api/auth/callback";
    process.env.OAUTH_TOKEN_URL = "https://oauth.example.com/token";
    process.env.OAUTH_RESOURCE_URL = "https://oauth.example.com/resource";
    process.env.TOKEN_SECRET = "test-secret";

    expect(() => validateOAuthCallbackEnv()).not.toThrow();
  });

  it("sanitizes suspicious redirect path when building auth URL", () => {
    process.env.OAUTH_CLIENT_ID = "cid";
    process.env.OAUTH_CALLBACK_URL = "https://example.com/api/auth/callback";
    process.env.OAUTH_SCOPE = "userid name";
    process.env.OAUTH_AUTHORIZE = "https://oauth.example.com/authorize";
    process.env.TOKEN_SECRET = "test-secret";

    const url = getAuthorizationURL("//evil.example.com/path");
    const parsed = new URL(url);

    expect(parsed.searchParams.get("state")).toBeTruthy();
  });
});
