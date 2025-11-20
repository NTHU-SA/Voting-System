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

  const vice1Payload = buildCandidatePayload(option.vice1);
  if (vice1Payload) payload.vice1 = vice1Payload;

  const vice2Payload = buildCandidatePayload(option.vice2);
  if (vice2Payload) payload.vice2 = vice2Payload;

  return payload;
}
