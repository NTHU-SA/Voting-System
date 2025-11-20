// Form-specific types for activity management
// These types differ from database types as they represent form input state

// Form representation of Candidate (with string fields for textarea inputs)
export interface CandidateForm {
  name: string;
  department: string;
  college: string;
  avatar_url: string;
  experiences: string; // String for textarea input (one item per line)
  opinions: string; // String for textarea input (one item per line)
}

export interface OptionFormData {
  label: string;
  candidate: CandidateForm;
  vice1: CandidateForm;
  vice2: CandidateForm;
}
