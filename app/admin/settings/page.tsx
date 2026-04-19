"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useUser } from "@/hooks";

interface AdminItem {
  student_id: string;
  name?: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [rootAdmin, setRootAdmin] = useState<string>("");
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admins", { credentials: "include" });
      const data = await response.json();
      if (!data.success) {
        setError(data.error || "載入管理員失敗");
        return;
      }
      setRootAdmin(data.data.root_admin || "");
      setAdmins(data.data.admins || []);
    } catch {
      setError("載入管理員失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user?.isRootAdmin) {
      router.push("/?error=admin_required");
      return;
    }
    fetchAdmins();
  }, [router, user, userLoading]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ student_id: studentId, name }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.error || "新增管理員失敗");
        return;
      }
      setStudentId("");
      setName("");
      fetchAdmins();
    } catch {
      setError("新增管理員失敗");
    }
  };

  const handleDelete = async (targetStudentId: string) => {
    setError("");
    try {
      const response = await fetch(
        `/api/admins?student_id=${encodeURIComponent(targetStudentId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (!data.success) {
        setError(data.error || "刪除管理員失敗");
        return;
      }
      fetchAdmins();
    } catch {
      setError("刪除管理員失敗");
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>管理員設定（ROOT_ADMIN 專屬）</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm text-muted-foreground">ROOT_ADMIN：{rootAdmin || "未設定"}</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>新增管理員</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3">
              <div>
                <Label htmlFor="student_id">學號</Label>
                <Input
                  id="student_id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">姓名（選填）</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  新增
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>管理員列表</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">載入中...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無資料</p>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.student_id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{admin.student_id}</p>
                      {admin.name && (
                        <p className="text-sm text-muted-foreground">{admin.name}</p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(admin.student_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
