"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Check, Edit, Trash2 } from "lucide-react";
import { CandidateFormFields } from "./CandidateFormFields";
import { ViceCandidateSection } from "./ViceCandidateSection";
import { useOptionForm } from "./useOptionForm";
import { emptyCandidateForm } from "./types";

interface OptionFormSectionProps {
  onOptionsChange?: (options: ReturnType<typeof useOptionForm>["options"]) => void;
}

export function OptionFormSection({ onOptionsChange }: OptionFormSectionProps) {
  const {
    options,
    currentOption,
    setCurrentOption,
    editingIndex,
    showVice1,
    setShowVice1,
    showVice2,
    setShowVice2,
    updateCandidate,
    addOrUpdateOption,
    editOption,
    removeOption,
    resetForm,
  } = useOptionForm();

  const handleAddOrUpdate = () => {
    if (!currentOption.candidate.name) {
      return;
    }
    addOrUpdateOption();
    if (onOptionsChange) {
      // Call with updated options after state update
      setTimeout(() => {
        onOptionsChange(editingIndex !== null 
          ? options.map((opt, idx) => idx === editingIndex ? currentOption : opt)
          : [...options, currentOption]
        );
      }, 0);
    }
  };

  const handleRemove = (index: number) => {
    removeOption(index);
    if (onOptionsChange) {
      setTimeout(() => {
        onOptionsChange(options.filter((_, i) => i !== index));
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current option form */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">
            {editingIndex !== null 
              ? `編輯候選人 #${editingIndex + 1}`
              : `新增候選人組合 #${options.length + 1}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">標籤（選填）</Label>
            <Input
              id="label"
              value={currentOption.label}
              onChange={(e) =>
                setCurrentOption({
                  ...currentOption,
                  label: e.target.value,
                })
              }
              placeholder="例：候選人組合、會長候選人"
            />
            <p className="text-xs text-muted-foreground">
              標籤將顯示在投票頁面，若不填寫則顯示為「候選人 N」
            </p>
          </div>

          <CandidateFormFields
            candidate={currentOption.candidate}
            onChange={(field, value) => updateCandidate("candidate", field, value)}
            label="正選候選人"
            required
          />

          <ViceCandidateSection
            vice1={currentOption.vice1}
            vice2={currentOption.vice2}
            showVice1={showVice1}
            showVice2={showVice2}
            onShowVice1={() => setShowVice1(true)}
            onShowVice2={() => setShowVice2(true)}
            onHideVice1={() => {
              setShowVice1(false);
              setCurrentOption({
                ...currentOption,
                vice1: emptyCandidateForm(),
              });
            }}
            onHideVice2={() => {
              setShowVice2(false);
              setCurrentOption({
                ...currentOption,
                vice2: emptyCandidateForm(),
              });
            }}
            onVice1Change={(field, value) => updateCandidate("vice1", field, value)}
            onVice2Change={(field, value) => updateCandidate("vice2", field, value)}
          />

          <div className="flex gap-2">
            {editingIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1"
              >
                取消編輯
              </Button>
            )}
            <Button
              type="button"
              onClick={handleAddOrUpdate}
              className="flex-1"
              disabled={!currentOption.candidate.name}
            >
              {editingIndex !== null ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  更新候選人
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  加入候選人列表
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Added options list */}
      {options.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">
            已新增的候選人 ({options.length})
          </h3>
          {options.map((option, index) => (
            <Card key={index} className={editingIndex === index ? "border-primary" : ""}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {option.label || `候選人 ${index + 1}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {option.candidate.name}
                    {option.vice1.name && ` · ${option.vice1.name}`}
                    {option.vice2.name && ` · ${option.vice2.name}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editOption(index)}
                    disabled={editingIndex !== null}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    disabled={editingIndex !== null}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Export the hook for external use
export { useOptionForm };
