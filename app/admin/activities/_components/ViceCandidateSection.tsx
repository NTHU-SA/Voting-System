"use client";

import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { CandidateForm } from "./types";
import { CandidateFormFields } from "./CandidateFormFields";

interface ViceCandidateSectionProps {
  vice1: CandidateForm;
  vice2: CandidateForm;
  showVice1: boolean;
  showVice2: boolean;
  onShowVice1: () => void;
  onShowVice2: () => void;
  onHideVice1: () => void;
  onHideVice2: () => void;
  onVice1Change: (field: keyof CandidateForm, value: string) => void;
  onVice2Change: (field: keyof CandidateForm, value: string) => void;
}

export function ViceCandidateSection({
  vice1,
  vice2,
  showVice1,
  showVice2,
  onShowVice1,
  onShowVice2,
  onHideVice1,
  onHideVice2,
  onVice1Change,
  onVice2Change,
}: ViceCandidateSectionProps) {
  return (
    <div className="space-y-3">
      {!showVice1 && !showVice2 && (
        <Button
          type="button"
          variant="outline"
          onClick={onShowVice1}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          新增副選候選人 1
        </Button>
      )}

      {showVice1 && (
        <div className="relative rounded-lg border border-border p-4 bg-background">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onHideVice1}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <CandidateFormFields
            candidate={vice1}
            onChange={onVice1Change}
            label="副選候選人 1（選填）"
          />
        </div>
      )}

      {showVice1 && !showVice2 && (
        <Button
          type="button"
          variant="outline"
          onClick={onShowVice2}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          新增副選候選人 2
        </Button>
      )}

      {showVice2 && (
        <div className="relative rounded-lg border border-border p-4 bg-background">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onHideVice2}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <CandidateFormFields
            candidate={vice2}
            onChange={onVice2Change}
            label="副選候選人 2（選填）"
          />
        </div>
      )}
    </div>
  );
}
