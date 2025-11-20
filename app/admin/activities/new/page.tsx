"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  AlertCircle,
  Check,
  Trash2,
  Edit,
} from "lucide-react";
import { useOptionForm } from "../_components/useOptionForm";
import { CandidateFormFields } from "../_components/CandidateFormFields";
import { ViceCandidateSection } from "../_components/ViceCandidateSection";
import { buildCandidatePayload } from "../_components/utils";
import { emptyCandidateForm } from "../_components/types";

function NewActivityWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Activity info
  const [activityData, setActivityData] = useState({
    name: "",
    type: "",
    description: "",
    rule: "choose_one" as "choose_one" | "choose_all",
    open_from: "",
    open_to: "",
  });

  // Step 2: Options/Candidates - using custom hook
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

  // Check admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();

        if (!data.authenticated || !data.user?.isAdmin) {
          router.push("/?error=admin_required");
          return;
        }
      } catch (err) {
        console.error("Error checking admin access:", err);
        router.push("/?error=auth_failed");
      }
    };
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivityChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setActivityData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (
      !activityData.name ||
      !activityData.type ||
      !activityData.open_from ||
      !activityData.open_to
    ) {
      setError("請填寫所有必填欄位");
      return false;
    }

    const openFrom = new Date(activityData.open_from);
    const openTo = new Date(activityData.open_to);
    if (openFrom >= openTo) {
      setError("結束時間必須晚於開始時間");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    }
  };

  const handleAddOption = () => {
    if (!currentOption.candidate.name) {
      setError("請至少填寫正選候選人姓名");
      return;
    }

    addOrUpdateOption();
    setError("");
  };

  const handleSubmit = async () => {
    if (options.length === 0) {
      setError("請至少新增一個候選人");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create activity
      const activityResponse = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(activityData),
      });

      const activityResult = await activityResponse.json();

      if (!activityResult.success) {
        setError(activityResult.error || "建立活動失敗");
        setLoading(false);
        return;
      }

      const activityId = activityResult.data._id;

      // Create options
      for (const option of options) {
        const optionData: Record<string, unknown> = {
          activity_id: activityId,
          label: option.label || undefined,
        };

        const candidatePayload = buildCandidatePayload(option.candidate);
        if (candidatePayload) optionData.candidate = candidatePayload;

        const vice1Payload = buildCandidatePayload(option.vice1);
        if (vice1Payload) optionData.vice1 = vice1Payload;

        const vice2Payload = buildCandidatePayload(option.vice2);
        if (vice2Payload) optionData.vice2 = vice2Payload;

        await fetch("/api/options", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(optionData),
        });
      }

      router.push(`/admin/activities/${activityId}`);
    } catch (err) {
      console.error("Error creating activity:", err);
      setError("建立活動時發生錯誤");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回後台
            </Link>
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > 1 ? <Check className="h-5 w-5" /> : "1"}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium">步驟 1</p>
                <p className="text-xs text-muted-foreground">活動基本資訊</p>
              </div>
            </div>

            <div className="h-px flex-1 mx-4 bg-border"></div>

            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium">步驟 2</p>
                <p className="text-xs text-muted-foreground">新增候選人</p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 ? "活動基本資訊" : "新增候選人"}
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">活動名稱 *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={activityData.name}
                    onChange={handleActivityChange}
                    placeholder="例：2025 學生會會長選舉"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">活動類型 *</Label>
                  <Input
                    id="type"
                    name="type"
                    type="text"
                    value={activityData.type}
                    onChange={handleActivityChange}
                    placeholder="例：學生會選舉"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">活動說明</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={activityData.description}
                    onChange={handleActivityChange}
                    placeholder="例：本次選舉將選出新任學生會會長及兩位副會長，任期為一年。請仔細閱讀各候選人政見後投票。"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    選填，將顯示在投票頁面作為活動說明
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule">投票方式 *</Label>
                  <select
                    id="rule"
                    name="rule"
                    value={activityData.rule}
                    onChange={handleActivityChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="choose_one">單選（選擇一個候選人）</option>
                    <option value="choose_all">
                      多選評分（對所有候選人表態）
                    </option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    單選：投票者只能選擇一個選項 |
                    多選評分：投票者需對每個選項表態（支持/反對/無意見）
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="open_from">開始時間 *</Label>
                    <Input
                      id="open_from"
                      name="open_from"
                      type="datetime-local"
                      value={activityData.open_from}
                      onChange={handleActivityChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="open_to">結束時間 *</Label>
                    <Input
                      id="open_to"
                      name="open_to"
                      type="datetime-local"
                      value={activityData.open_to}
                      onChange={handleActivityChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1"
                  >
                    下一步：新增候選人
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Current option form */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      新增候選人組合 #{options.length + 1}
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
                        onClick={handleAddOption}
                        className="flex-1"
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
                              onClick={() => removeOption(index)}
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

                <Separator />

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || options.length === 0}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loading />
                        <span className="ml-2">建立中...</span>
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        完成建立
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function NewActivityWizardPage() {
  return <NewActivityWizard />;
}
