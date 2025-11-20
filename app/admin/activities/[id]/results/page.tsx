"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Users, Award, AlertCircle } from "lucide-react";
import { useAdminAccess } from "@/hooks";

interface ActivityStats {
  activity: {
    id: string;
    name: string;
    type: string;
    rule: string;
    open_from: string;
    open_to: string;
  };
  statistics: {
    totalVotes: number;
    totalEligibleVoters: number;
    turnoutRate: string;
    optionStats: {
      option_id: string;
      name: string;
      support: number;
      oppose: number;
      neutral: number;
      total: number;
    }[];
  };
}

function ResultsPageContent() {
  const params = useParams();
  const activityId = params.id as string;

  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats?activity_id=${activityId}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "無法載入統計資料");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("載入統計資料時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  // Check admin access and fetch stats on success
  useAdminAccess(() => {
    fetchStats();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-7xl px-6 py-12">
          <Loading text="載入統計資料中..." />
        </main>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-7xl px-6 py-8">
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 py-8">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error || "無法載入統計資料"}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Calculate winner for choose_one
  const winner =
    stats.activity.rule === "choose_one"
      ? stats.statistics.optionStats.reduce((prev, current) =>
          current.support > prev.support ? current : prev,
        )
      : null;

  // Sort options by support votes
  const sortedOptions = [...stats.statistics.optionStats].sort(
    (a, b) => b.support - a.support,
  );

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

        {/* Activity Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{stats.activity.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {stats.activity.type}
            </p>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="text-muted-foreground">投票方式：</span>
                <span className="font-semibold">
                  {stats.activity.rule === "choose_one" ? "單選" : "多選評分"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">活動期間：</span>
                <span className="font-semibold">
                  {new Date(stats.activity.open_from).toLocaleString("zh-TW")}{" "}
                  至 {new Date(stats.activity.open_to).toLocaleString("zh-TW")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    總投票數
                  </p>
                  <p className="text-4xl font-bold">
                    {stats.statistics.totalVotes}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    合格選民數
                  </p>
                  <p className="text-4xl font-bold">
                    {stats.statistics.totalEligibleVoters}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    投票率
                  </p>
                  <p className="text-4xl font-bold">
                    {stats.statistics.turnoutRate}%
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Winner Announcement (for choose_one) */}
        {stats.activity.rule === "choose_one" && winner && (
          <Card className="mb-8 border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                <CardTitle>當選者</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{winner.name}</p>
                  <p className="text-muted-foreground">
                    獲得 {winner.support} 票
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {(
                      (winner.support / stats.statistics.totalVotes) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-sm text-muted-foreground">得票率</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>詳細結果</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-6">
              {sortedOptions.map((option, index) => {
                const totalVotes = stats.statistics.totalVotes || 1; // Avoid division by zero
                const supportPercent = (option.support / totalVotes) * 100;
                const opposePercent = (option.oppose / totalVotes) * 100;
                const neutralPercent = (option.neutral / totalVotes) * 100;

                return (
                  <div key={option.option_id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{option.name}</p>
                          {stats.activity.rule === "choose_all" && (
                            <p className="text-sm text-muted-foreground">
                              總表態數: {option.total}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {option.support}
                        </p>
                        <p className="text-xs text-muted-foreground">支持票</p>
                      </div>
                    </div>

                    {/* Progress bars */}
                    {stats.activity.rule === "choose_one" ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>支持</span>
                          <span className="font-semibold">
                            {supportPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${supportPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-green-600">支持</span>
                            <span className="font-semibold">
                              {option.support} ({supportPercent.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${supportPercent}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-red-600">反對</span>
                            <span className="font-semibold">
                              {option.oppose} ({opposePercent.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-red-500 transition-all"
                              style={{ width: `${opposePercent}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-gray-600">無意見</span>
                            <span className="font-semibold">
                              {option.neutral} ({neutralPercent.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-gray-400 transition-all"
                              style={{ width: `${neutralPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {index < sortedOptions.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return <ResultsPageContent />;
}
