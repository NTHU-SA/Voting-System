import { readFile } from "fs/promises";
import { join } from "path";
import { parse } from "csv-parse/sync";
import { API_CONSTANTS } from "@/lib/constants";

let adminCache: string[] = [];
let lastLoadTime = 0;

export async function loadAdmins(): Promise<string[]> {
  const now = Date.now();

  // Return cached data if still valid
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
      (record: { student_id: string }) => record.student_id,
    );
    lastLoadTime = now;

    return adminCache;
  } catch (error) {
    console.error("Error loading adminList.csv:", error);
    return [];
  }
}

export async function isAdmin(studentId: string): Promise<boolean> {
  const admins = await loadAdmins();
  return admins.includes(studentId);
}

export function clearAdminCache(): void {
  adminCache = [];
  lastLoadTime = 0;
}
