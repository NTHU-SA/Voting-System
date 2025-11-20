import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";

const VOTER_LIST_PATH = path.join(process.cwd(), "data", "voterList.csv");

let cachedVoterList: string[] | null = null;

export async function loadVoterList(): Promise<string[]> {
  if (cachedVoterList) {
    return cachedVoterList;
  }

  try {
    const csvContent = await fs.readFile(VOTER_LIST_PATH, "utf-8");
    cachedVoterList = parseVoterList(csvContent);
    return cachedVoterList;
  } catch (error) {
    console.error("Failed to load voter list:", error);
    return [];
  }
}

export function parseVoterList(csvContent: string): string[] {
  try {
    const records = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
    });

    // Skip header row and extract student IDs from first column
    const studentIds = records
      .slice(1)
      .map((record: string[]) => record[0])
      .filter(Boolean);
    return studentIds;
  } catch (error) {
    console.error("Failed to parse voter list:", error);
    return [];
  }
}

export function isStudentEligible(
  studentId: string,
  voterList: string[],
): boolean {
  return voterList.includes(studentId);
}

export function reloadVoterList(): void {
  cachedVoterList = null;
}
