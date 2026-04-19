"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, Home, Copy, Check, User, Trash2 } from "lucide-react";
import { loadVotingHistory, clearVotingHistory, removeVoteRecordByToken } from "@/lib/votingHistory";
import { VotingHistory } from "@/types";
import { useUser } from "@/hooks";
import { API_CONSTANTS } from "@/lib/constants";

export default function CompletionPage() {
  const router = useRouter();
  const [votingHistory, setVotingHistory] = useState<VotingHistory | null>(
    () => loadVotingHistory(),
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const { user: userInfo } = useUser();

  const handleCopyToken = (token: string, index: number) => {
    navigator.clipboard.writeText(token);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearHistory = () => {
    if (
      window.confirm(API_CONSTANTS.MESSAGES.CONFIRM_CLEAR_ALL_HISTORY)
    ) {
      clearVotingHistory();
      setVotingHistory({ votedActivityIds: [], votes: [] });
    }
  };

  const handleRemoveVote = (token: string, activityName: string) => {
    if (
      window.confirm(API_CONSTANTS.MESSAGES.CONFIRM_REMOVE_VOTE(activityName))
    ) {
      const updatedHistory = removeVoteRecordByToken(token);
      setVotingHistory(updatedHistory);
    }
  };

  if (!votingHistory || votingHistory.votes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-6 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="mb-4 text-2xl font-bold">尚無投票記錄</h2>
              <p className="mb-6 text-muted-foreground">
                您還沒有參與任何投票活動
              </p>
              <Button onClick={() => router.push("/vote")}>前往投票</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
            投票完成證明
          </h1>
          <p className="mb-6 text-base text-muted-foreground sm:text-lg">
            感謝您的參與！以下是您的投票證明記錄
          </p>

          <div className="flex justify-center gap-4 print:hidden">
            <Button onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              列印 / 儲存 PDF
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
              aria-label="清除所有投票記錄"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              清除所有記錄
            </Button>
          </div>
        </div>

        {/* User Info Section */}
        {userInfo && (
          <Card className="mb-8 shadow-sm">
            <CardContent className="flex items-center justify-center gap-4 py-6 flex-row sm:gap-12">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">姓名</p>
                  <p className="text-md font-bold">{userInfo.name}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border sm:block" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">學號</p>
                <p className="text-lg font-bold font-mono">
                  {userInfo.student_id}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Certificate Card */}
        <Card className="mb-8 shadow-md">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">投票證明總覽</CardTitle>
              <Badge variant="outline" className="bg-background">
                共 {votingHistory.votes.length} 項投票
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {votingHistory.votes.map((vote, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <h3 className="font-bold text-foreground">
                          {vote.activityName}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        學號：{vote.studentId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        投票時間：
                        {new Date(vote.timestamp).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="ml-2">
                        #{index + 1}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveVote(vote.token, vote.activityName)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive print:hidden"
                        title="刪除此投票記錄"
                        aria-label="刪除此投票記錄"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        投票證明 UUID
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyToken(vote.token, index)}
                        className="h-6 px-2 text-xs hover:bg-background"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="mr-1 h-3 w-3 text-emerald-600" />
                            已複製
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            複製
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="break-all font-mono text-sm text-foreground">
                      {vote.token}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="mb-8 border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-amber-900">
              <span className="text-xl">📌</span>
              重要提醒
            </h3>
            <ul className="space-y-2 text-sm text-amber-900/80">
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>
                  請截圖保存此頁面作為投票完成證明（可用於期末慰問會等活動）
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>每個 UUID 都是您投票的唯一證明，請妥善保存</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>
                  投票記錄儲存在您的瀏覽器本地，清除瀏覽器資料可能會遺失記錄
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>
                  您可以使用「清除所有記錄」按鈕來移除本地的 UUID 憑證，但這不會影響伺服器上的投票結果
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row print:hidden">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            <Home className="mr-2 h-4 w-4" />
            返回首頁
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/vote")}
          >
            前往投票
          </Button>
        </div>

        {/* Print Footer */}
        <div className="hidden mt-12 text-center text-sm text-muted-foreground print:block">
          <p>國立清華大學學生會投票系統</p>
          <p>列印時間：{new Date().toLocaleString("zh-TW")}</p>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
