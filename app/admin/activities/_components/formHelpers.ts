import { CandidateForm, OptionFormData } from "./types";

/**
 * Creates an empty candidate form object
 */
export const createEmptyCandidate = (): CandidateForm => ({
  name: "",
  department: "",
  college: "",
  avatar_url: "",
  experiences: "",
  opinions: "",
});

/**
 * Creates an empty option form object with empty candidates
 */
export const createEmptyOption = (): OptionFormData => ({
  label: "",
  candidate: createEmptyCandidate(),
  vice: [],
});
