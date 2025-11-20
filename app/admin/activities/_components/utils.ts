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

/**
 * Helper type for flat form structure used in edit page
 */
export interface FlatOptionForm {
  label: string;
  candidate_name: string;
  candidate_department: string;
  candidate_college: string;
  candidate_avatar_url: string;
  candidate_experiences: string;
  candidate_opinions: string;
  vice1_name: string;
  vice1_department: string;
  vice1_college: string;
  vice1_avatar_url: string;
  vice1_experiences: string;
  vice1_opinions: string;
  vice2_name: string;
  vice2_department: string;
  vice2_college: string;
  vice2_avatar_url: string;
  vice2_experiences: string;
  vice2_opinions: string;
}

/**
 * Builds option payload from flat form (edit page structure)
 */
export function buildOptionPayloadFromFlat(form: FlatOptionForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    label: form.label || undefined,
  };

  // Build candidate
  if (form.candidate_name) {
    const candidate: Record<string, unknown> = { name: form.candidate_name };
    if (form.candidate_department) candidate.department = form.candidate_department;
    if (form.candidate_college) candidate.college = form.candidate_college;
    if (form.candidate_avatar_url) candidate.avatar_url = form.candidate_avatar_url;
    if (form.candidate_experiences) {
      candidate.personal_experiences = form.candidate_experiences.split("\n").filter((e) => e.trim());
    }
    if (form.candidate_opinions) {
      candidate.political_opinions = form.candidate_opinions.split("\n").filter((e) => e.trim());
    }
    payload.candidate = candidate;
  }

  // Build vice1
  if (form.vice1_name) {
    const vice1: Record<string, unknown> = { name: form.vice1_name };
    if (form.vice1_department) vice1.department = form.vice1_department;
    if (form.vice1_college) vice1.college = form.vice1_college;
    if (form.vice1_avatar_url) vice1.avatar_url = form.vice1_avatar_url;
    if (form.vice1_experiences) {
      vice1.personal_experiences = form.vice1_experiences.split("\n").filter((e) => e.trim());
    }
    if (form.vice1_opinions) {
      vice1.political_opinions = form.vice1_opinions.split("\n").filter((e) => e.trim());
    }
    payload.vice1 = vice1;
  }

  // Build vice2
  if (form.vice2_name) {
    const vice2: Record<string, unknown> = { name: form.vice2_name };
    if (form.vice2_department) vice2.department = form.vice2_department;
    if (form.vice2_college) vice2.college = form.vice2_college;
    if (form.vice2_avatar_url) vice2.avatar_url = form.vice2_avatar_url;
    if (form.vice2_experiences) {
      vice2.personal_experiences = form.vice2_experiences.split("\n").filter((e) => e.trim());
    }
    if (form.vice2_opinions) {
      vice2.political_opinions = form.vice2_opinions.split("\n").filter((e) => e.trim());
    }
    payload.vice2 = vice2;
  }

  return payload;
}

/**
 * Empty flat form for edit page
 */
export function emptyFlatForm(): FlatOptionForm {
  return {
    label: "",
    candidate_name: "",
    candidate_department: "",
    candidate_college: "",
    candidate_avatar_url: "",
    candidate_experiences: "",
    candidate_opinions: "",
    vice1_name: "",
    vice1_department: "",
    vice1_college: "",
    vice1_avatar_url: "",
    vice1_experiences: "",
    vice1_opinions: "",
    vice2_name: "",
    vice2_department: "",
    vice2_college: "",
    vice2_avatar_url: "",
    vice2_experiences: "",
    vice2_opinions: "",
  };
}
