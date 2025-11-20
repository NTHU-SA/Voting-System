"use client";

import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { CandidateForm } from "./types";
import { CandidateFormFields } from "./CandidateFormFields";

interface ViceCandidateSectionProps {
  vices: CandidateForm[];
  onAddVice: () => void;
  onRemoveVice: (index: number) => void;
  onViceChange: (index: number, field: keyof CandidateForm, value: string) => void;
}

export function ViceCandidateSection({
  vices,
  onAddVice,
  onRemoveVice,
  onViceChange,
}: ViceCandidateSectionProps) {
  return (
    <div className="space-y-3">
      {vices.map((vice, index) => (
        <div
          key={index}
          className="relative rounded-lg border border-border p-4 bg-background"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveVice(index)}
            className="absolute top-2 right-2"
            aria-label={`移除副選候選人 ${index + 1}`}
          >
            <X className="h-4 w-4" />
          </Button>
          <CandidateFormFields
            candidate={vice}
            onChange={(field, value) => onViceChange(index, field, value)}
            label={`副選候選人 ${index + 1}（選填）`}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={onAddVice}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        新增副選候選人{vices.length > 0 && ` ${vices.length + 1}`}
      </Button>
    </div>
  );
}
