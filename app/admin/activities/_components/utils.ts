import { Candidate } from "./types";

/**
 * Builds API payload for a candidate with optional fields
 */
export function buildCandidatePayload(candidate: Candidate): Record<string, unknown> | null {
  if (!candidate.name) return null;

  const payload: Record<string, unknown> = {
    name: candidate.name,
  };

  if (candidate.department) payload.department = candidate.department;
  if (candidate.college) payload.college = candidate.college;
  if (candidate.avatar_url) payload.avatar_url = candidate.avatar_url;

  if (candidate.experiences) {
    payload.personal_experiences = candidate.experiences
      .split("\n")
      .filter((e) => e.trim());
  }

  if (candidate.opinions) {
    payload.political_opinions = candidate.opinions
      .split("\n")
      .filter((e) => e.trim());
  }

  return payload;
}

/**
 * Converts candidate arrays back to newline-separated strings
 */
export function candidateFromAPI(data: {
  name: string;
  department?: string;
  college?: string;
  avatar_url?: string;
  personal_experiences?: string[];
  political_opinions?: string[];
}): Candidate {
  return {
    name: data.name || "",
    department: data.department || "",
    college: data.college || "",
    avatar_url: data.avatar_url || "",
    experiences: data.personal_experiences?.join("\n") || "",
    opinions: data.political_opinions?.join("\n") || "",
  };
}
