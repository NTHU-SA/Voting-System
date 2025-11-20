"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Candidate } from "./types";

interface CandidateFormFieldsProps {
  candidate: Candidate;
  onChange: (field: keyof Candidate, value: string) => void;
  label: string;
  required?: boolean;
}

export function CandidateFormFields({
  candidate,
  onChange,
  label,
  required = false,
}: CandidateFormFieldsProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">{label}</h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          placeholder={`姓名${required ? " *" : ""}`}
          value={candidate.name}
          onChange={(e) => onChange("name", e.target.value)}
          required={required}
        />
        <Input
          placeholder="系所（選填）"
          value={candidate.department}
          onChange={(e) => onChange("department", e.target.value)}
        />
        <Input
          placeholder="學院（選填）"
          value={candidate.college}
          onChange={(e) => onChange("college", e.target.value)}
        />
      </div>
      <Input
        placeholder="照片網址（選填）- 請輸入外部圖片連結"
        value={candidate.avatar_url}
        onChange={(e) => onChange("avatar_url", e.target.value)}
      />
      <Textarea
        placeholder="個人經歷（選填，一行一項）"
        value={candidate.experiences}
        onChange={(e) => onChange("experiences", e.target.value)}
        rows={3}
      />
      <Textarea
        placeholder="政見（選填，一行一項）"
        value={candidate.opinions}
        onChange={(e) => onChange("opinions", e.target.value)}
        rows={3}
      />
    </div>
  );
}
