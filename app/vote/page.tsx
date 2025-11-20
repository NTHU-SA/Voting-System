"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loader";
import {
  Calendar,
  Tag,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { hasVoted } from "@/lib/votingHistory";
import { useActivities, useUser, useActivityStatusBadge } from "@/hooks";

export default function VotePage() {
  const { activities, loading, error } = useActivities();
  const { user } = useUser();
  const { getStatusBadge } = useActivityStatusBadge();

  const currentStudentId = user?.student_id || "";

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-7xl px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">投票活動選擇</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            選擇您要參與的投票活動
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Activities List */}
        {activities.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="mb-3 text-2xl font-semibold">
                目前沒有進行中的投票活動
              </h3>
              <p className="mb-6 text-muted-foreground">請稍後再回來查看</p>
              <Button variant="outline" asChild>
                <Link href="/">返回首頁</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {activities.map((activity) => (
              <Card
                key={activity._id}
                className="transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{activity.name}</CardTitle>
                      {activity.subtitle && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.subtitle}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(activity)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activity.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activity.description}
                    </p>
                  )}

                  <div className="flex items-center text-sm">
                    <Tag className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="font-medium">類型：</span>
                    <span className="ml-1 text-muted-foreground">
                      {activity.type}
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="font-medium">投票方式：</span>
                    <span className="ml-1 text-muted-foreground">
                      {activity.rule === "choose_all" ? "多選評分" : "單選"}
                    </span>
                  </div>

                  <div className="flex items-start text-sm">
                    <Calendar className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="flex-1">
                      <span className="font-medium">截止時間：</span>
                      <span className="ml-1 block text-muted-foreground sm:inline">
                        {new Date(activity.open_to).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    {hasVoted(activity._id, currentStudentId) ? (
                      <div className="space-y-2">
                        <Badge variant="default" className="w-full py-2">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          已完成投票
                        </Badge>
                        <Button className="w-full" variant="outline" asChild>
                          <Link href={`/vote/${activity._id}`}>查看詳情</Link>
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full" asChild>
                        <Link href={`/vote/${activity._id}`}>開始投票</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首頁
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
