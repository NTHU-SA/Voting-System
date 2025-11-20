// Shared types for activity management
export interface Candidate {
  name: string;
  department: string;
  college: string;
  avatar_url: string;
  experiences: string;
  opinions: string;
}

export interface OptionFormData {
  label: string;
  candidate: Candidate;
  vice1: Candidate;
  vice2: Candidate;
}

export const emptyCandidateForm = (): Candidate => ({
  name: "",
  department: "",
  college: "",
  avatar_url: "",
  experiences: "",
  opinions: "",
});

export const emptyOptionForm = (): OptionFormData => ({
  label: "",
  candidate: emptyCandidateForm(),
  vice1: emptyCandidateForm(),
  vice2: emptyCandidateForm(),
});
