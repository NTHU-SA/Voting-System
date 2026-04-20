import "server-only";
import connectDB from "@/lib/db";
import { Admin } from "@/lib/models/Admin";

// 1. 重新導出 JWT 相關功能 (保持 JWT 邏輯獨立是好的，因為它是純運算)
export { generateToken, verifyToken } from "@/lib/jwt";

// --------------------------------------------------------
// 2. Admin 權限檢查邏輯 (原 adminConfig.ts 的內容)
// --------------------------------------------------------

export function getRootAdminStudentId(): string | null {
  const rootAdmin = process.env.ROOT_ADMIN?.trim();
  return rootAdmin || null;
}

/**
 * 檢查學號是否為 ROOT_ADMIN
 */
export function isRootAdmin(studentId: string): boolean {
  if (!studentId) return false;
  const rootAdmin = getRootAdminStudentId();
  return !!rootAdmin && rootAdmin === studentId;
}

/**
 * 檢查學號是否為管理員（ROOT_ADMIN 或 Admin DB）
 */
export async function isAdmin(studentId: string): Promise<boolean> {
  if (!studentId) return false;
  if (isRootAdmin(studentId)) return true;

  await connectDB();
  const admin = await Admin.findOne({ student_id: studentId }).select("_id");
  return !!admin;
}
