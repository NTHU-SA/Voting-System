"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, CheckCircle2, AlertCircle, ListChecks } from "lucide-react";
import { formatDateTime } from "@/utils/formatDate";

interface VerifyResult {
  uuid: string;
  activity_name: string;
  voted_at: string;
  selections: string[];
}

export default function VerifyPage() {
  const [uuid, setUuid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid.trim()) {
      setError("請輸入 UUID");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/verify/${encodeURIComponent(uuid.trim())}`);
      const data = await response.json();

      if (!data.success) {
        if (response.status === 404) {
          setError("查無此 UUID 投票記錄");
        } else if (response.status === 400) {
          setError("UUID 格式或參數錯誤");
        } else {
          setError(data.error || "查詢失敗");
        }
      } else {
        setResult(data.data);
      }
    } catch {
      setError("查詢時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-6 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>公開驗票查詢</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <form onSubmit={handleVerify} className="flex gap-2">
              <Input
                value={uuid}
                onChange={(e) => setUuid(e.target.value)}
                placeholder="輸入投票 UUID"
              />
              <Button type="submit" disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? "查詢中" : "查詢"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 py-4 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {error}
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="space-y-3 py-6">
              <p className="flex items-center gap-2 font-semibold text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                已找到投票紀錄
              </p>
              <p>活動：{result.activity_name}</p>
              <p>UUID：{result.uuid}</p>
              <p>投票時間：{formatDateTime(result.voted_at)}</p>
              <div>
                <p className="mb-1 flex items-center gap-1 font-medium">
                  <ListChecks className="h-4 w-4" />
                  投票內容
                </p>
                <ul className="list-inside list-disc text-sm">
                  {result.selections.map((selection, index) => (
                    <li key={index}>{selection}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
