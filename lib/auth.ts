import "server-only";
import { readFile } from "fs/promises";
import { join } from "path";
import { parse } from "csv-parse/sync";
import { API_CONSTANTS } from "@/lib/constants";

// 1. 重新導出 JWT 相關功能 (保持 JWT 邏輯獨立是好的，因為它是純運算)
export { generateToken, verifyToken } from "@/lib/jwt";

// --------------------------------------------------------
// 2. Admin 權限檢查邏輯 (原 adminConfig.ts 的內容)
// --------------------------------------------------------

// 快取機制
let adminCache: string[] = [];
let lastLoadTime = 0;

/**
 * 從 CSV 讀取管理員名單 (包含快取邏輯)
 */
async function loadAdmins(): Promise<string[]> {
  const now = Date.now();

  // Cache 檢查
  if (
    adminCache.length > 0 &&
    now - lastLoadTime < API_CONSTANTS.ADMIN_CACHE_DURATION
  ) {
    return adminCache;
  }

  try {
    const filePath = join(process.cwd(), "data", "adminList.csv");
    const fileContent = await readFile(filePath, "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    adminCache = records.map(
      (record: { student_id: string }) => record.student_id
    );
    lastLoadTime = now;

    return adminCache;
  } catch (error) {
    console.error("Error loading adminList.csv:", error);
    throw new Error("Failed to load adminList.csv");
  }
}

/**
 * 檢查學號是否為管理員
 */
export async function isAdmin(studentId: string): Promise<boolean> {
  if (!studentId) return false;
  const admins = await loadAdmins();
  return admins.includes(studentId);
}
