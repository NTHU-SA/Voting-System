"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { getVotedActivityIds } from "@/lib/votingHistory";
import { useActivities, useUser } from "@/hooks";

export default function CompletionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = params.id as string;

  const [activityName, setActivityName] = useState<string>("");
  const [voteToken, setVoteToken] = useState<string>("");
  const [votedActivityIds, setVotedActivityIds] = useState<string[]>([]);

  const { user } = useUser();
  const { activities: allActivities } = useActivities();

  useEffect(() => {
    // Get data from URL params
    const token = searchParams.get("token");
    const name = searchParams.get("name");

    if (token) setVoteToken(token);
    if (name) setActivityName(decodeURIComponent(name));

    setVotedActivityIds(getVotedActivityIds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Find next unvoted activity
  const nextActivity = allActivities.find(
    (act) => act._id !== activityId && !votedActivityIds.includes(act._id),
  );
  const allVoted =
    allActivities.length > 0 &&
    allActivities.every((act) => votedActivityIds.includes(act._id));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-6 py-8 sm:py-12">
        {/* Success Icon and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">投票成功！</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            感謝您的參與，您的投票已成功送出
          </p>
        </div>

        {/* Activity Info */}
        {activityName && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <p className="text-center text-sm text-muted-foreground">
                投票活動
              </p>
              <p className="text-center text-lg font-bold">{activityName}</p>
            </CardContent>
          </Card>
        )}

        {/* Voter Information Card */}
        {user && (
          <Card className="mb-6 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-lg">投票人資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <span className="text-sm font-semibold text-muted-foreground">
                  學號
                </span>
                <span className="font-mono text-base font-bold">
                  {user.student_id}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <span className="text-sm font-semibold text-muted-foreground">
                  姓名
                </span>
                <span className="text-base font-bold">{user.name}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* UUID Certificate Card */}
        {voteToken && (
          <Card className="mb-8 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-lg">
                投票證明 UUID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="break-all rounded-lg border bg-muted p-4 font-mono text-sm">
                {voteToken}
              </div>
              <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
                請妥善保存此 UUID，這是您投票的唯一證明。
                <br />
                系統採用匿名投票機制，無法追溯您的投票內容。
              </p>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {allVoted ? (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-primary" />
                <h3 className="mb-2 text-xl font-bold">
                  🎉 恭喜！您已完成所有投票活動
                </h3>
                <p className="text-sm text-muted-foreground">
                  您已經投完所有開放中的投票活動，感謝您的參與！
                </p>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/vote")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回投票列表
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => router.push("/vote/certificate")}
              >
                查看投票證明
              </Button>
            </div>
          </div>
        ) : nextActivity ? (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <h3 className="mb-2 text-lg font-bold">下一個投票活動</h3>
                <p className="text-base font-medium text-muted-foreground">
                  {nextActivity.name}
                </p>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/vote")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回投票列表
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => router.push(`/vote/${nextActivity._id}`)}
              >
                繼續投票
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/vote")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回投票列表
          </Button>
        )}
      </main>
    </div>
  );
}
