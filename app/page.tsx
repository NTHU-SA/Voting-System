"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Lock,
  UserCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Vote,
  TrendingUp,
} from "lucide-react";
import { fetchActiveActivities, Activity } from "@/lib/activities";

export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivitiesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActivitiesData = async () => {
    try {
      const activeActivities = await fetchActiveActivities();
      setActivities(activeActivities);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-7xl px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16 space-y-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Vote className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
            學生會投票系統
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            NTHUSA Voting System
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/vote">
                前往投票
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!loading && activities.length > 0 && (
              <Button
                variant="secondary"
                size="lg"
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {activities.length} 個投票活動進行中
              </Button>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">為什麼選擇我們</h2>
            <p className="text-muted-foreground">專為學生會設計的投票系統</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="group transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">安全可靠</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  採用 OAuth + JWT 驗證，沒有人能冒用您的身份投票
                </p>
              </CardContent>
            </Card>

            <Card className="group transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <UserCheck className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">完全匿名</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  投票資料轉換為 UUID 匿名記錄，保護選票的隱私權益
                </p>
              </CardContent>
            </Card>

            <Card className="group transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">快速便捷</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  無論何時何地都能輕鬆完成投票，並節省大量人力物力
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it works Section */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-8 text-center">
            <CardTitle className="text-3xl">投票流程</CardTitle>
            <p className="mt-2 text-muted-foreground">
              四個簡單步驟，輕鬆完成投票
            </p>
          </CardHeader>
          <CardContent className="pb-12 pt-12">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
              {[
                {
                  num: "1",
                  title: "登入系統",
                  desc: "使用校務資訊系統 OAuth 登入，我們不會儲存您的任何資料",
                  icon: UserCheck,
                },
                {
                  num: "2",
                  title: "選擇活動",
                  desc: "選擇您要參與的投票活動，查看候選人政見",
                  icon: Vote,
                },
                {
                  num: "3",
                  title: "進行投票",
                  desc: "投下您的一票，您的選票將被轉換為 UUID 匿名紀錄",
                  icon: CheckCircle2,
                },
                {
                  num: "4",
                  title: "完成投票",
                  desc: "取得投票憑證，確認您的投票已成功記錄",
                  icon: TrendingUp,
                },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.num} className="relative text-center">
                    {index < 3 && (
                      <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-primary to-primary/20 md:block" />
                    )}
                    <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
                      {step.num}
                    </div>
                    <div className="mb-4 flex justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="mb-3 text-lg font-bold">{step.title}</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
