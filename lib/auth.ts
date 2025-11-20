export { generateToken, verifyToken } from "@/lib/jwt";
import { isAdmin as checkIsAdmin } from "@/lib/adminConfig";

export async function isAdmin(studentId: string): Promise<boolean> {
  return checkIsAdmin(studentId);
}
