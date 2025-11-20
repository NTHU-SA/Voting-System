import { CandidateForm, OptionFormData } from "./types";

/**
 * Builds API payload for a candidate with optional fields
 */
function buildCandidatePayload(candidate: CandidateForm): Record<string, unknown> | null {
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
 * Builds option payload from OptionFormData for API submission
 */
export function buildOptionPayload(option: OptionFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (option.label) payload.label = option.label;

  const candidatePayload = buildCandidatePayload(option.candidate);
  if (candidatePayload) payload.candidate = candidatePayload;

  // Build vice array from all vice candidates
  const vicePayloads = option.vice
    .map(buildCandidatePayload)
    .filter((v) => v !== null);
  if (vicePayloads.length > 0) payload.vice = vicePayloads;

  return payload;
}
