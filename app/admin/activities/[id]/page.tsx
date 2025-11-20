"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Save,
  Trash2,
  Plus,
  AlertCircle,
  Edit,
  BarChart3,
  ClipboardCheck,
  Eye,
} from "lucide-react";

interface Activity {
  _id: string;
  name: string;
  type: string;
  description?: string;
  rule: "choose_one" | "choose_all";
  open_from: string;
  open_to: string;
  users: string[];
  options: Option[];
}

interface Option {
  _id: string;
  label?: string;
  candidate?: {
    name: string;
    department?: string;
    college?: string;
    avatar_url?: string;
    personal_experiences?: string[];
    political_opinions?: string[];
  };
  vice1?: {
    name: string;
    department?: string;
    college?: string;
    avatar_url?: string;
    personal_experiences?: string[];
    political_opinions?: string[];
  };
  vice2?: {
    name: string;
    department?: string;
    college?: string;
    avatar_url?: string;
    personal_experiences?: string[];
    political_opinions?: string[];
  };
}

interface NewOptionForm {
  label: string;
  candidate_name: string;
  candidate_department: string;
  candidate_college: string;
  candidate_avatar_url: string;
  candidate_experiences: string;
  candidate_opinions: string;
  vice1_name: string;
  vice1_department: string;
  vice1_college: string;
  vice1_avatar_url: string;
  vice1_experiences: string;
  vice1_opinions: string;
  vice2_name: string;
  vice2_department: string;
  vice2_college: string;
  vice2_avatar_url: string;
  vice2_experiences: string;
  vice2_opinions: string;
}

function ActivityDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
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

  // New option form
  const [showNewOption, setShowNewOption] = useState(false);
  const [newOption, setNewOption] = useState<NewOptionForm>({
    label: "",
    candidate_name: "",
    candidate_department: "",
    candidate_college: "",
    candidate_avatar_url: "",
    candidate_experiences: "",
    candidate_opinions: "",
    vice1_name: "",
    vice1_department: "",
    vice1_college: "",
    vice1_avatar_url: "",
    vice1_experiences: "",
    vice1_opinions: "",
    vice2_name: "",
    vice2_department: "",
    vice2_college: "",
    vice2_avatar_url: "",
    vice2_experiences: "",
    vice2_opinions: "",
  });

  // Edit option form
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOption, setEditOption] = useState<NewOptionForm>({
    label: "",
    candidate_name: "",
    candidate_department: "",
    candidate_college: "",
    candidate_avatar_url: "",
    candidate_experiences: "",
    candidate_opinions: "",
    vice1_name: "",
    vice1_department: "",
    vice1_college: "",
    vice1_avatar_url: "",
    vice1_experiences: "",
    vice1_opinions: "",
    vice2_name: "",
    vice2_department: "",
    vice2_college: "",
    vice2_avatar_url: "",
    vice2_experiences: "",
    vice2_opinions: "",
  });

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/auth/check");
      const data = await response.json();

      if (!data.authenticated || !data.user?.isAdmin) {
        // Not authenticated or not an admin, redirect to home
        router.push("/?error=admin_required");
        return;
      }

      fetchActivity();
    } catch (err) {
      console.error("Error checking admin access:", err);
      router.push("/?error=auth_failed");
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await fetch(
        `/api/activities/${activityId}?include_options=true`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();

      if (data.success) {
        setActivity(data.data);
        // Convert to local datetime format for datetime-local input
        // by removing timezone offset adjustment
        const openFromDate = new Date(data.data.open_from);
        const openToDate = new Date(data.data.open_to);

        // Format as YYYY-MM-DDTHH:MM in local time
        const formatLocalDateTime = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setFormData({
          name: data.data.name,
          type: data.data.type,
          description: data.data.description || "",
          rule: data.data.rule,
          open_from: formatLocalDateTime(openFromDate),
          open_to: formatLocalDateTime(openToDate),
        });
      } else {
        setError(data.error || "無法載入活動資訊");
      }
    } catch (err) {
      console.error("Error fetching activity:", err);
      setError("載入活動時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("活動資訊已更新");
        // Don't refetch to avoid datetime jumping - just update activity
        setActivity(data.data);
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

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const optionData: Record<string, unknown> = {
        activity_id: activityId,
        label: newOption.label || undefined,
      };

      if (newOption.candidate_name) {
        const candidate: Record<string, unknown> = {
          name: newOption.candidate_name,
        };
        if (newOption.candidate_department)
          candidate.department = newOption.candidate_department;
        if (newOption.candidate_college)
          candidate.college = newOption.candidate_college;
        if (newOption.candidate_avatar_url)
          candidate.avatar_url = newOption.candidate_avatar_url;
        if (newOption.candidate_experiences) {
          candidate.personal_experiences = newOption.candidate_experiences
            .split("\n")
            .filter((e) => e.trim());
        }
        if (newOption.candidate_opinions) {
          candidate.political_opinions = newOption.candidate_opinions
            .split("\n")
            .filter((e) => e.trim());
        }
        optionData.candidate = candidate;
      }

      if (newOption.vice1_name) {
        const vice1: Record<string, unknown> = {
          name: newOption.vice1_name,
        };
        if (newOption.vice1_department)
          vice1.department = newOption.vice1_department;
        if (newOption.vice1_college) vice1.college = newOption.vice1_college;
        if (newOption.vice1_avatar_url)
          vice1.avatar_url = newOption.vice1_avatar_url;
        if (newOption.vice1_experiences) {
          vice1.personal_experiences = newOption.vice1_experiences
            .split("\n")
            .filter((e) => e.trim());
        }
        if (newOption.vice1_opinions) {
          vice1.political_opinions = newOption.vice1_opinions
            .split("\n")
            .filter((e) => e.trim());
        }
        optionData.vice1 = vice1;
      }

      if (newOption.vice2_name) {
        const vice2: Record<string, unknown> = {
          name: newOption.vice2_name,
        };
        if (newOption.vice2_department)
          vice2.department = newOption.vice2_department;
        if (newOption.vice2_college) vice2.college = newOption.vice2_college;
        if (newOption.vice2_avatar_url)
          vice2.avatar_url = newOption.vice2_avatar_url;
        if (newOption.vice2_experiences) {
          vice2.personal_experiences = newOption.vice2_experiences
            .split("\n")
            .filter((e) => e.trim());
        }
        if (newOption.vice2_opinions) {
          vice2.political_opinions = newOption.vice2_opinions
            .split("\n")
            .filter((e) => e.trim());
        }
        optionData.vice2 = vice2;
      }

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
        setShowNewOption(false);
        setNewOption({
          label: "",
          candidate_name: "",
          candidate_department: "",
          candidate_college: "",
          candidate_avatar_url: "",
          candidate_experiences: "",
          candidate_opinions: "",
          vice1_name: "",
          vice1_department: "",
          vice1_college: "",
          vice1_avatar_url: "",
          vice1_experiences: "",
          vice1_opinions: "",
          vice2_name: "",
          vice2_department: "",
          vice2_college: "",
          vice2_avatar_url: "",
          vice2_experiences: "",
          vice2_opinions: "",
        });
        fetchActivity();
      } else {
        setError(data.error || "新增候選人失敗");
      }
    } catch (err) {
      console.error("Error adding option:", err);
      setError("新增候選人時發生錯誤");
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
        fetchActivity();
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

  const handleStartEdit = (option: Option) => {
    setEditingOptionId(option._id);
    setEditOption({
      label: option.label || "",
      candidate_name: option.candidate?.name || "",
      candidate_department: option.candidate?.department || "",
      candidate_college: option.candidate?.college || "",
      candidate_avatar_url: option.candidate?.avatar_url || "",
      candidate_experiences:
        option.candidate?.personal_experiences?.join("\n") || "",
      candidate_opinions:
        option.candidate?.political_opinions?.join("\n") || "",
      vice1_name: option.vice1?.name || "",
      vice1_department: option.vice1?.department || "",
      vice1_college: option.vice1?.college || "",
      vice1_avatar_url: option.vice1?.avatar_url || "",
      vice1_experiences: option.vice1?.personal_experiences?.join("\n") || "",
      vice1_opinions: option.vice1?.political_opinions?.join("\n") || "",
      vice2_name: option.vice2?.name || "",
      vice2_department: option.vice2?.department || "",
      vice2_college: option.vice2?.college || "",
      vice2_avatar_url: option.vice2?.avatar_url || "",
      vice2_experiences: option.vice2?.personal_experiences?.join("\n") || "",
      vice2_opinions: option.vice2?.political_opinions?.join("\n") || "",
    });
  };

  const handleUpdateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOptionId) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const optionData: Record<string, unknown> = {
        label: editOption.label || undefined,
      };

      if (editOption.candidate_name) {
        const candidate: Record<string, unknown> = {
          name: editOption.candidate_name,
        };
        if (editOption.candidate_department)
          candidate.department = editOption.candidate_department;
        if (editOption.candidate_college)
          candidate.college = editOption.candidate_college;
        if (editOption.candidate_avatar_url)
          candidate.avatar_url = editOption.candidate_avatar_url;
        if (editOption.candidate_experiences) {
          candidate.personal_experiences = editOption.candidate_experiences
            .split("\n")
            .filter((e) => e.trim());
        }
        if (editOption.candidate_opinions) {
          candidate.political_opinions = editOption.candidate_opinions
            .split("\n")
            .filter((e) => e.trim());
        }
        optionData.candidate = candidate;
      }

      if (editOption.vice1_name) {
        const vice1: Record<string, unknown> = {
          name: editOption.vice1_name,
        };
        if (editOption.vice1_department)
          vice1.department = editOption.vice1_department;
        if (editOption.vice1_college) vice1.college = editOption.vice1_college;
        if (editOption.vice1_avatar_url)
          vice1.avatar_url = editOption.vice1_avatar_url;
        if (editOption.vice1_experiences) {
          vice1.personal_experiences = editOption.vice1_experiences
            .split("\n")
            .filter((e) => e.trim());
        }
        if (editOption.vice1_opinions) {
          vice1.political_opinions = editOption.vice1_opinions
            .split("\n")
            .filter((e) => e.trim());
        }
        optionData.vice1 = vice1;
      }

      if (editOption.vice2_name) {
        const vice2: Record<string, unknown> = {
          name: editOption.vice2_name,
        };
        if (editOption.vice2_department)
          vice2.department = editOption.vice2_department;
        if (editOption.vice2_college) vice2.college = editOption.vice2_college;
        if (editOption.vice2_avatar_url)
          vice2.avatar_url = editOption.vice2_avatar_url;
        if (editOption.vice2_experiences) {
          vice2.personal_experiences = editOption.vice2_experiences
            .split("\n")
            .filter((e) => e.trim());
        }
        if (editOption.vice2_opinions) {
          vice2.political_opinions = editOption.vice2_opinions
            .split("\n")
            .filter((e) => e.trim());
        }
        optionData.vice2 = vice2;
      }

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
        setEditingOptionId(null);
        fetchActivity();
      } else {
        setError(data.error || "更新候選人失敗");
      }
    } catch (err) {
      console.error("Error updating option:", err);
      setError("更新候選人時發生錯誤");
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
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回後台
            </Link>
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/vote/${activityId}`}>
                <Eye className="mr-2 h-4 w-4" />
                預覽活動
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/activities/${activityId}/results`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                查看統計
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/activities/${activityId}/verification`}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                驗票
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">活動名稱</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">活動類型</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">活動說明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={saving}
                  placeholder="選填，將顯示在投票頁面作為活動說明"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule">投票方式</Label>
                <select
                  id="rule"
                  value={formData.rule}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rule: e.target.value as "choose_one" | "choose_all",
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={saving}
                >
                  <option value="choose_one">單選</option>
                  <option value="choose_all">多選評分</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="open_from">開始時間</Label>
                  <Input
                    id="open_from"
                    type="datetime-local"
                    value={formData.open_from}
                    onChange={(e) =>
                      setFormData({ ...formData, open_from: e.target.value })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="open_to">結束時間</Label>
                  <Input
                    id="open_to"
                    type="datetime-local"
                    value={formData.open_to}
                    onChange={(e) =>
                      setFormData({ ...formData, open_to: e.target.value })
                    }
                    disabled={saving}
                  />
                </div>
              </div>

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
              <Button
                onClick={() => setShowNewOption(!showNewOption)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增候選人
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {/* Add New Option Form */}
            {showNewOption && (
              <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">新增候選人</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddOption} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="label">標籤（選填）</Label>
                      <Input
                        id="label"
                        value={newOption.label}
                        onChange={(e) =>
                          setNewOption({ ...newOption, label: e.target.value })
                        }
                        placeholder="例：候選人組合、會長候選人"
                      />
                      <p className="text-xs text-muted-foreground">
                        標籤將顯示在投票頁面，若不填寫則不顯示
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">正選候選人</h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Input
                          placeholder="姓名 *"
                          value={newOption.candidate_name}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              candidate_name: e.target.value,
                            })
                          }
                          required
                        />
                        <Input
                          placeholder="系所（選填）"
                          value={newOption.candidate_department}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              candidate_department: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="學院（選填）"
                          value={newOption.candidate_college}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              candidate_college: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Input
                        placeholder="照片網址（選填）- 請輸入外部圖片連結"
                        value={newOption.candidate_avatar_url}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            candidate_avatar_url: e.target.value,
                          })
                        }
                      />
                      <Textarea
                        placeholder="個人經歷（選填，一行一項）"
                        value={newOption.candidate_experiences}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            candidate_experiences: e.target.value,
                          })
                        }
                        rows={3}
                      />
                      <Textarea
                        placeholder="政見（選填，一行一項）"
                        value={newOption.candidate_opinions}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            candidate_opinions: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">副選候選人 1（選填）</h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Input
                          placeholder="姓名"
                          value={newOption.vice1_name}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              vice1_name: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="系所（選填）"
                          value={newOption.vice1_department}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              vice1_department: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="學院（選填）"
                          value={newOption.vice1_college}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              vice1_college: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Input
                        placeholder="照片網址（選填）- 請輸入外部圖片連結"
                        value={newOption.vice1_avatar_url}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            vice1_avatar_url: e.target.value,
                          })
                        }
                      />
                      <Textarea
                        placeholder="個人經歷（選填，一行一項）"
                        value={newOption.vice1_experiences}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            vice1_experiences: e.target.value,
                          })
                        }
                        rows={3}
                      />
                      <Textarea
                        placeholder="政見（選填，一行一項）"
                        value={newOption.vice1_opinions}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            vice1_opinions: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">副選候選人 2（選填）</h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Input
                          placeholder="姓名"
                          value={newOption.vice2_name}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              vice2_name: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="系所（選填）"
                          value={newOption.vice2_department}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              vice2_department: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="學院（選填）"
                          value={newOption.vice2_college}
                          onChange={(e) =>
                            setNewOption({
                              ...newOption,
                              vice2_college: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Input
                        placeholder="照片網址（選填）- 請輸入外部圖片連結"
                        value={newOption.vice2_avatar_url}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            vice2_avatar_url: e.target.value,
                          })
                        }
                      />
                      <Textarea
                        placeholder="個人經歷（選填，一行一項）"
                        value={newOption.vice2_experiences}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            vice2_experiences: e.target.value,
                          })
                        }
                        rows={3}
                      />
                      <Textarea
                        placeholder="政見（選填，一行一項）"
                        value={newOption.vice2_opinions}
                        onChange={(e) =>
                          setNewOption({
                            ...newOption,
                            vice2_opinions: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewOption(false)}
                      >
                        取消
                      </Button>
                      <Button type="submit" disabled={saving}>
                        <Plus className="mr-2 h-4 w-4" />
                        新增
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
                      {editingOptionId === option._id ? (
                        // Edit Form
                        <form
                          onSubmit={handleUpdateOption}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="edit-label">標籤（選填）</Label>
                            <Input
                              id="edit-label"
                              value={editOption.label}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  label: e.target.value,
                                })
                              }
                              placeholder="例：候選人組合、會長候選人"
                            />
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold">正選候選人</h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <Input
                                placeholder="姓名 *"
                                value={editOption.candidate_name}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    candidate_name: e.target.value,
                                  })
                                }
                                required
                              />
                              <Input
                                placeholder="系所（選填）"
                                value={editOption.candidate_department}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    candidate_department: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="學院（選填）"
                                value={editOption.candidate_college}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    candidate_college: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Input
                              placeholder="照片網址（選填）- 請輸入外部圖片連結"
                              value={editOption.candidate_avatar_url}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  candidate_avatar_url: e.target.value,
                                })
                              }
                            />
                            <Textarea
                              placeholder="個人經歷（選填，一行一項）"
                              value={editOption.candidate_experiences}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  candidate_experiences: e.target.value,
                                })
                              }
                              rows={3}
                            />
                            <Textarea
                              placeholder="政見（選填，一行一項）"
                              value={editOption.candidate_opinions}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  candidate_opinions: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold">
                              副選候選人 1（選填）
                            </h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <Input
                                placeholder="姓名"
                                value={editOption.vice1_name}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    vice1_name: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="系所（選填）"
                                value={editOption.vice1_department}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    vice1_department: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="學院（選填）"
                                value={editOption.vice1_college}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    vice1_college: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Input
                              placeholder="照片網址（選填）- 請輸入外部圖片連結"
                              value={editOption.vice1_avatar_url}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  vice1_avatar_url: e.target.value,
                                })
                              }
                            />
                            <Textarea
                              placeholder="個人經歷（選填，一行一項）"
                              value={editOption.vice1_experiences}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  vice1_experiences: e.target.value,
                                })
                              }
                              rows={3}
                            />
                            <Textarea
                              placeholder="政見（選填，一行一項）"
                              value={editOption.vice1_opinions}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  vice1_opinions: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold">
                              副選候選人 2（選填）
                            </h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <Input
                                placeholder="姓名"
                                value={editOption.vice2_name}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    vice2_name: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="系所（選填）"
                                value={editOption.vice2_department}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    vice2_department: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="學院（選填）"
                                value={editOption.vice2_college}
                                onChange={(e) =>
                                  setEditOption({
                                    ...editOption,
                                    vice2_college: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Input
                              placeholder="照片網址（選填）- 請輸入外部圖片連結"
                              value={editOption.vice2_avatar_url}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  vice2_avatar_url: e.target.value,
                                })
                              }
                            />
                            <Textarea
                              placeholder="個人經歷（選填，一行一項）"
                              value={editOption.vice2_experiences}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  vice2_experiences: e.target.value,
                                })
                              }
                              rows={3}
                            />
                            <Textarea
                              placeholder="政見（選填，一行一項）"
                              value={editOption.vice2_opinions}
                              onChange={(e) =>
                                setEditOption({
                                  ...editOption,
                                  vice2_opinions: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingOptionId(null)}
                            >
                              取消
                            </Button>
                            <Button type="submit" disabled={saving}>
                              <Save className="mr-2 h-4 w-4" />
                              儲存
                            </Button>
                          </div>
                        </form>
                      ) : (
                        // Display View
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

                            {option.vice1 && (
                              <div className="ml-4 mb-1 text-sm">
                                <span className="text-muted-foreground">
                                  副選 1:{" "}
                                </span>
                                <span>{option.vice1.name}</span>
                                {option.vice1.department && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    ({option.vice1.department})
                                  </span>
                                )}
                              </div>
                            )}

                            {option.vice2 && (
                              <div className="ml-4 text-sm">
                                <span className="text-muted-foreground">
                                  副選 2:{" "}
                                </span>
                                <span>{option.vice2.name}</span>
                                {option.vice2.department && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    ({option.vice2.department})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEdit(option)}
                              disabled={saving}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteOption(option._id)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                尚未新增任何候選人
              </p>
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
