"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  AlertCircle,
  Edit,
  BarChart3,
  ClipboardCheck,
  Eye,
  Check,
  X,
} from "lucide-react";
import { ActivityFormFields } from "../_components/ActivityFormFields";
import { CandidateFormFields } from "../_components/CandidateFormFields";
import { ViceCandidateSection } from "../_components/ViceCandidateSection";
import { OptionFormData } from "../_components/types";
import { buildOptionPayload } from "../_components/utils";
import { createEmptyCandidate, createEmptyOption } from "../_components/formHelpers";
import { useAdminAccess, useAdminActivity } from "@/hooks";
import { Option } from "@/types";
import { toDateTimeLocalString, fromDateTimeLocalString } from "@/utils/formatDate";

function ActivityDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const { activity, loading, refetch } = useAdminActivity(activityId);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    rule: "choose_one" as "choose_one" | "choose_all",
    open_from: "",
    open_to: "",
  });

  // New/Edit option form state
  const [showNewOption, setShowNewOption] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [currentOption, setCurrentOption] = useState<OptionFormData>(createEmptyOption());

  // Check admin access
  useAdminAccess();

  // Update form data when activity loads
  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        type: activity.type,
        description: activity.description || "",
        rule: activity.rule,
        open_from: toDateTimeLocalString(activity.open_from),
        open_to: toDateTimeLocalString(activity.open_to),
      });
    }
  }, [activity]);

  const handleActivityChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      // Convert datetime-local strings to UTC ISO strings before sending
      const activityPayload = {
        ...formData,
        open_from: fromDateTimeLocalString(formData.open_from).toISOString(),
        open_to: fromDateTimeLocalString(formData.open_to).toISOString(),
      };
      
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(activityPayload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("活動資訊已更新");
        await refetch();
      } else {
        setError(data.error || "更新活動失敗");
      }
    } catch (err) {
      console.error("Error updating activity:", err);
      setError("更新活動時發生錯誤");
    } finally {
      setSaving(false);
    }
  };

  const updateCandidate = (
    field: keyof typeof currentOption.candidate,
    value: string
  ) => {
    setCurrentOption((prev) => ({
      ...prev,
      candidate: {
        ...prev.candidate,
        [field]: value,
      },
    }));
  };

  const addVice = () => {
    setCurrentOption((prev) => ({
      ...prev,
      vice: [...prev.vice, createEmptyCandidate()],
    }));
  };

  const removeVice = (index: number) => {
    setCurrentOption((prev) => ({
      ...prev,
      vice: prev.vice.filter((_, i) => i !== index),
    }));
  };

  const updateVice = (
    index: number,
    field: keyof typeof currentOption.candidate,
    value: string
  ) => {
    setCurrentOption((prev) => ({
      ...prev,
      vice: prev.vice.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const resetOptionForm = () => {
    setCurrentOption(createEmptyOption());
    setEditingOptionId(null);
    setShowNewOption(false);
  };

  const handleStartAddOption = () => {
    resetOptionForm();
    setShowNewOption(true);
  };

  const handleStartEditOption = (option: Option) => {
    setEditingOptionId(option._id);
    setCurrentOption({
      label: option.label || "",
      candidate: {
        name: option.candidate?.name || "",
        department: option.candidate?.department || "",
        college: option.candidate?.college || "",
        avatar_url: option.candidate?.avatar_url || "",
        experiences: option.candidate?.personal_experiences?.join("\n") || "",
        opinions: option.candidate?.political_opinions?.join("\n") || "",
      },
      vice: (option.vice || []).map((v) => ({
        name: v.name || "",
        department: v.department || "",
        college: v.college || "",
        avatar_url: v.avatar_url || "",
        experiences: v.personal_experiences?.join("\n") || "",
        opinions: v.political_opinions?.join("\n") || "",
      })),
    });
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOption.candidate.name) {
      setError("請至少填寫正選候選人姓名");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const optionData = buildOptionPayload(currentOption);

      if (editingOptionId) {
        // Update existing option
        const response = await fetch(`/api/options/${editingOptionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(optionData),
        });

        const data = await response.json();

        if (data.success) {
          setSuccessMessage("候選人已更新");
          resetOptionForm();
          await refetch();
        } else {
          setError(data.error || "更新候選人失敗");
        }
      } else {
        // Add new option
        optionData.activity_id = activityId;

        const response = await fetch("/api/options", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(optionData),
        });

        const data = await response.json();

        if (data.success) {
          setSuccessMessage("候選人已新增");
          resetOptionForm();
          await refetch();
        } else {
          setError(data.error || "新增候選人失敗");
        }
      }
    } catch (err) {
      console.error("Error saving option:", err);
      setError("儲存候選人時發生錯誤");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm("確定要刪除此候選人嗎？")) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/options/${optionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("候選人已刪除");
        await refetch();
      } else {
        setError(data.error || "刪除候選人失敗");
      }
    } catch (err) {
      console.error("Error deleting option:", err);
      setError("刪除候選人時發生錯誤");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!confirm("確定要刪除此活動嗎？此操作無法復原！")) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin");
      } else {
        setError(data.error || "刪除活動失敗");
        setSaving(false);
      }
    } catch (err) {
      console.error("Error deleting activity:", err);
      setError("刪除活動時發生錯誤");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-7xl px-6 py-12">
          <Loading text="載入中..." />
        </main>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-7xl px-6 py-8">
          <Card>
            <CardContent className="flex items-center gap-2 py-8">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">找不到活動</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/admin">
              <ArrowLeft className="sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">返回後台</span>
            </Link>
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" asChild className="shrink-0">
              <Link href={`/vote/${activityId}`}>
                <Eye className="sm:mr-2 h-4 w-4" />
                <span className="sm:inline">預覽活動</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="shrink-0">
              <Link href={`/admin/activities/${activityId}/results`}>
                <BarChart3 className="sm:mr-2 h-4 w-4" />
                <span className="sm:inline">查看統計</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="shrink-0">
              <Link href={`/admin/activities/${activityId}/verification`}>
                <ClipboardCheck className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">驗票</span>
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="mb-6 border-green-500 bg-green-50">
            <CardContent className="flex items-center gap-2 py-4">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-600">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Activity Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              編輯活動資訊
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <form onSubmit={handleUpdateActivity} className="space-y-6">
              <ActivityFormFields
                formData={formData}
                onChange={handleActivityChange}
                disabled={saving}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteActivity}
                  disabled={saving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  刪除活動
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  儲存變更
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Options List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                候選人管理 ({activity.options?.length || 0})
              </CardTitle>
              {!showNewOption && !editingOptionId && (
                <Button
                  onClick={handleStartAddOption}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增候選人
                </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {/* Add/Edit Option Form */}
            {(showNewOption || editingOptionId) && (
              <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {editingOptionId ? "編輯候選人" : "新增候選人"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveOption} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="label">標籤（選填）</Label>
                      <Input
                        id="label"
                        value={currentOption.label}
                        onChange={(e) =>
                          setCurrentOption({ ...currentOption, label: e.target.value })
                        }
                        placeholder="例：候選人組合、會長候選人"
                      />
                      <p className="text-xs text-muted-foreground">
                        標籤將顯示在投票頁面，若不填寫則顯示為「候選人 N」
                      </p>
                    </div>

                    <CandidateFormFields
                      candidate={currentOption.candidate}
                      onChange={(field, value) => updateCandidate(field, value)}
                      label="正選候選人"
                      required
                    />

                    <ViceCandidateSection
                      vices={currentOption.vice}
                      onAddVice={addVice}
                      onRemoveVice={removeVice}
                      onViceChange={updateVice}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetOptionForm}
                      >
                        <X className="mr-2 h-4 w-4" />
                        取消
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {editingOptionId ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            更新
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            新增
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Options List */}
            {activity.options && activity.options.length > 0 ? (
              <div className="space-y-4">
                {activity.options.map((option, index) => (
                  <Card key={option._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                              {index + 1}
                            </span>
                            {option.label && (
                              <span className="text-sm text-muted-foreground">
                                {option.label}
                              </span>
                            )}
                          </div>

                          {option.candidate && (
                            <div className="mb-2">
                              <p className="font-semibold">
                                {option.candidate.name}
                              </p>
                              {(option.candidate.department ||
                                option.candidate.college) && (
                                <p className="text-sm text-muted-foreground">
                                  {[
                                    option.candidate.department,
                                    option.candidate.college,
                                  ]
                                    .filter(Boolean)
                                    .join(" | ")}
                                </p>
                              )}
                            </div>
                          )}

                          {option.vice &&
                            option.vice.map((vice, viceIndex) => (
                              <div key={viceIndex} className="ml-4 mb-1 text-sm">
                                <span className="text-muted-foreground">
                                  副選 {viceIndex + 1}:{" "}
                                </span>
                                <span>{vice.name}</span>
                                {vice.department && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    ({vice.department})
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEditOption(option)}
                            disabled={saving || showNewOption || editingOptionId !== null}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteOption(option._id)}
                            disabled={saving || showNewOption || editingOptionId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              !showNewOption && (
                <p className="py-8 text-center text-muted-foreground">
                  尚未新增任何候選人
                </p>
              )
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ActivityDetailPage() {
  return <ActivityDetailPageContent />;
}
