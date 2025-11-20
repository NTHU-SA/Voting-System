"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { formatDateTime } from "@/utils/formatDate";

interface VerificationData {
  activity_id: string;
  total_votes: number;
  voted_tokens: {
    uuid: string;
    voted_at: string;
  }[];
}

function VerificationPageContent() {
  const params = useParams();
  const activityId = params.id as string;

  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchToken, setSearchToken] = useState("");
  const [searchResult, setSearchResult] = useState<
    "found" | "not-found" | null
  >(null);

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/auth/check");
      const authData = await response.json();

      if (!authData.authenticated || !authData.user?.isAdmin) {
        // Not authenticated or not an admin, redirect to home
        window.location.href = "/?error=admin_required";
        return;
      }

      fetchVerificationData();
    } catch (err) {
      console.error("Error checking admin access:", err);
      window.location.href = "/?error=auth_failed";
    }
  };

  const fetchVerificationData = async () => {
    try {
      const response = await fetch(
        `/api/activities/${activityId}/verification`,
        {
          credentials: "include",
        },
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "無法載入驗證資料");
      }
    } catch (err) {
      console.error("Error fetching verification data:", err);
      setError("載入驗證資料時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !searchToken.trim()) {
      setSearchResult(null);
      return;
    }

    const found = data.voted_tokens.some(
      (token) => token.uuid.toLowerCase() === searchToken.trim().toLowerCase(),
    );
    setSearchResult(found ? "found" : "not-found");
  };

  const handleDownloadCSV = () => {
    if (!data) return;

    const csvContent = [
      ["投票憑證 UUID", "投票時間"],
      ...data.voted_tokens.map((token) => [
        token.uuid,
        formatDateTime(token.voted_at),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `voting_verification_${activityId}_${Date.now()}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-7xl px-6 py-12">
          <Loading text="載入驗證資料中..." />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-7xl px-6 py-8">
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 py-8">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error || "無法載入驗證資料"}</p>
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
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/admin/activities/${activityId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回活動管理
            </Link>
          </Button>
        </div>

        {/* Overview Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>投票驗證</CardTitle>
            <CardDescription>驗證投票憑證 UUID 是否已投票</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="mb-6 flex items-center justify-between rounded-lg bg-muted p-4">
              <div>
                <p className="text-sm text-muted-foreground">總投票數</p>
                <p className="text-3xl font-bold">{data.total_votes}</p>
              </div>
              <Button onClick={handleDownloadCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                下載 CSV
              </Button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="輸入投票憑證 UUID 進行查詢..."
                  value={searchToken}
                  onChange={(e) => {
                    setSearchToken(e.target.value);
                    setSearchResult(null);
                  }}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="mr-2 h-4 w-4" />
                  查詢
                </Button>
              </div>

              {/* Search Result */}
              {searchResult && (
                <div
                  className={`flex items-center gap-2 rounded-md border p-4 ${
                    searchResult === "found"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-red-500 bg-red-50 text-red-700"
                  }`}
                >
                  {searchResult === "found" ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="font-semibold">
                        此 UUID 已投票！您的投票已被成功記錄。
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      <p className="font-semibold">
                        找不到此 UUID 的投票記錄。
                      </p>
                    </>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Voted Tokens List */}
        <Card>
          <CardHeader>
            <CardTitle>已投票憑證列表</CardTitle>
            <CardDescription>
              顯示所有已投票的憑證 UUID（匿名化）
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {data.voted_tokens.length > 0 ? (
              <div className="max-h-[600px] space-y-2 overflow-y-auto">
                {data.voted_tokens.map((token, index) => (
                  <div
                    key={token.uuid}
                    className="flex items-center justify-between rounded-md border bg-muted/50 p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <code className="rounded bg-background px-2 py-1 font-mono text-xs">
                        {token.uuid}
                      </code>
                    </div>
                    <span className="text-muted-foreground">
                      {formatDateTime(token.voted_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                尚無投票記錄
              </p>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p className="mb-2 font-semibold">關於投票驗證</p>
                <ul className="list-inside list-disc space-y-1 text-blue-800">
                  <li>每個投票者在完成投票後會獲得唯一的 UUID 憑證</li>
                  <li>投票者可使用此憑證驗證其投票是否被正確記錄</li>
                  <li>UUID 與投票者身份完全分離，確保匿名性</li>
                  <li>管理員無法透過 UUID 追蹤投票者的投票內容</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function VerificationPage() {
  return <VerificationPageContent />;
}
