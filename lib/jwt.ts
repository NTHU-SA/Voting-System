import { SignJWT, jwtVerify } from "jose";
import { JWTPayload, AuthUser } from "@/types";
import { API_CONSTANTS } from "@/lib/constants";

function getTokenSecret(): string {
  if (!process.env.TOKEN_SECRET) {
    throw new Error(
      "TOKEN_SECRET environment variable is required but not set",
    );
  }
  return process.env.TOKEN_SECRET;
}

export async function generateToken(user: AuthUser): Promise<string> {
  const TOKEN_SECRET = getTokenSecret();
  const secret = new TextEncoder().encode(TOKEN_SECRET);

  // _id is set to student_id since we don't use MongoDB User collection
  const payload = {
    account: user.student_id,
    _id: user.student_id, // Use student_id as _id (no User collection)
    student_id: user.student_id,
    name: user.name,
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(API_CONSTANTS.JWT_EXPIRATION)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const TOKEN_SECRET = getTokenSecret();
    const secret = new TextEncoder().encode(TOKEN_SECRET);

    const { payload } = await jwtVerify(token, secret);
    // Validate the payload has required fields
    if (
      payload &&
      typeof payload === "object" &&
      "student_id" in payload &&
      typeof payload.student_id === "string"
    ) {
      return payload as unknown as JWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}
