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
  X,
} from "lucide-react";

interface CandidateForm {
  name: string;
  department: string;
  college: string;
  avatar_url: string;
  experiences: string;
  opinions: string;
}

interface OptionForm {
  label: string;
  candidate: CandidateForm;
  vice1: CandidateForm;
  vice2: CandidateForm;
}

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

  // Step 2: Options/Candidates
  const [options, setOptions] = useState<OptionForm[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showVice1, setShowVice1] = useState(false);
  const [showVice2, setShowVice2] = useState(false);
  const [currentOption, setCurrentOption] = useState<OptionForm>({
    label: "",
    candidate: {
      name: "",
      department: "",
      college: "",
      avatar_url: "",
      experiences: "",
      opinions: "",
    },
    vice1: {
      name: "",
      department: "",
      college: "",
      avatar_url: "",
      experiences: "",
      opinions: "",
    },
    vice2: {
      name: "",
      department: "",
      college: "",
      avatar_url: "",
      experiences: "",
      opinions: "",
    },
  });

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

    if (editingIndex !== null) {
      // Update existing option
      const newOptions = [...options];
      newOptions[editingIndex] = currentOption;
      setOptions(newOptions);
      setEditingIndex(null);
    } else {
      // Add new option
      setOptions([...options, currentOption]);
    }

    // Reset form
    setCurrentOption({
      label: "",
      candidate: {
        name: "",
        department: "",
        college: "",
        avatar_url: "",
        experiences: "",
        opinions: "",
      },
      vice1: {
        name: "",
        department: "",
        college: "",
        avatar_url: "",
        experiences: "",
        opinions: "",
      },
      vice2: {
        name: "",
        department: "",
        college: "",
        avatar_url: "",
        experiences: "",
        opinions: "",
      },
    });
    setShowVice1(false);
    setShowVice2(false);
    setError("");
  };

  const handleEditOption = (index: number) => {
    setCurrentOption(options[index]);
    setEditingIndex(index);
    // Show vice forms if they have data
    setShowVice1(!!options[index].vice1.name);
    setShowVice2(!!options[index].vice2.name);
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentOption({
      label: "",
      candidate: {
        name: "",
        department: "",
        college: "",
        avatar_url: "",
        experiences: "",
        opinions: "",
      },
      vice1: {
        name: "",
        department: "",
        college: "",
        avatar_url: "",
        experiences: "",
        opinions: "",
      },
      vice2: {
        name: "",
        department: "",
        college: "",
        avatar_url: "",
        experiences: "",
        opinions: "",
      },
    });
    setShowVice1(false);
    setShowVice2(false);
    setError("");
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
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

        if (option.candidate.name) {
          const candidate: Record<string, unknown> = {
            name: option.candidate.name,
          };
          if (option.candidate.department)
            candidate.department = option.candidate.department;
          if (option.candidate.college)
            candidate.college = option.candidate.college;
          if (option.candidate.avatar_url)
            candidate.avatar_url = option.candidate.avatar_url;
          if (option.candidate.experiences) {
            candidate.personal_experiences = option.candidate.experiences
              .split("\n")
              .filter((e) => e.trim());
          }
          if (option.candidate.opinions) {
            candidate.political_opinions = option.candidate.opinions
              .split("\n")
              .filter((e) => e.trim());
          }
          optionData.candidate = candidate;
        }

        if (option.vice1.name) {
          const vice1: Record<string, unknown> = {
            name: option.vice1.name,
          };
          if (option.vice1.department)
            vice1.department = option.vice1.department;
          if (option.vice1.college) vice1.college = option.vice1.college;
          if (option.vice1.avatar_url)
            vice1.avatar_url = option.vice1.avatar_url;
          if (option.vice1.experiences) {
            vice1.personal_experiences = option.vice1.experiences
              .split("\n")
              .filter((e) => e.trim());
          }
          if (option.vice1.opinions) {
            vice1.political_opinions = option.vice1.opinions
              .split("\n")
              .filter((e) => e.trim());
          }
          optionData.vice1 = vice1;
        }

        if (option.vice2.name) {
          const vice2: Record<string, unknown> = {
            name: option.vice2.name,
          };
          if (option.vice2.department)
            vice2.department = option.vice2.department;
          if (option.vice2.college) vice2.college = option.vice2.college;
          if (option.vice2.avatar_url)
            vice2.avatar_url = option.vice2.avatar_url;
          if (option.vice2.experiences) {
            vice2.personal_experiences = option.vice2.experiences
              .split("\n")
              .filter((e) => e.trim());
          }
          if (option.vice2.opinions) {
            vice2.political_opinions = option.vice2.opinions
              .split("\n")
              .filter((e) => e.trim());
          }
          optionData.vice2 = vice2;
        }

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

  const renderCandidateForm = (
    candidate: CandidateForm,
    onChange: (field: keyof CandidateForm, value: string) => void,
    label: string,
    required: boolean = false,
  ) => (
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

                    {renderCandidateForm(
                      currentOption.candidate,
                      (field, value) =>
                        setCurrentOption({
                          ...currentOption,
                          candidate: {
                            ...currentOption.candidate,
                            [field]: value,
                          },
                        }),
                      "正選候選人",
                      true,
                    )}

                    {/* Vice candidate buttons and forms */}
                    <div className="space-y-3">
                      {!showVice1 && !showVice2 && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowVice1(true)}
                            className="flex-1"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            新增副選候選人 1
                          </Button>
                        </div>
                      )}

                      {showVice1 && (
                        <div className="relative rounded-lg border border-border p-4 bg-background">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowVice1(false);
                              setCurrentOption({
                                ...currentOption,
                                vice1: {
                                  name: "",
                                  department: "",
                                  college: "",
                                  avatar_url: "",
                                  experiences: "",
                                  opinions: "",
                                },
                              });
                            }}
                            className="absolute top-2 right-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {renderCandidateForm(
                            currentOption.vice1,
                            (field, value) =>
                              setCurrentOption({
                                ...currentOption,
                                vice1: { ...currentOption.vice1, [field]: value },
                              }),
                            "副選候選人 1（選填）",
                          )}
                        </div>
                      )}

                      {showVice1 && !showVice2 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowVice2(true)}
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
                            onClick={() => {
                              setShowVice2(false);
                              setCurrentOption({
                                ...currentOption,
                                vice2: {
                                  name: "",
                                  department: "",
                                  college: "",
                                  avatar_url: "",
                                  experiences: "",
                                  opinions: "",
                                },
                              });
                            }}
                            className="absolute top-2 right-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {renderCandidateForm(
                            currentOption.vice2,
                            (field, value) =>
                              setCurrentOption({
                                ...currentOption,
                                vice2: { ...currentOption.vice2, [field]: value },
                              }),
                            "副選候選人 2（選填）",
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {editingIndex !== null && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
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
                              onClick={() => handleEditOption(index)}
                              disabled={editingIndex !== null}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveOption(index)}
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
