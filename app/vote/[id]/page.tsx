"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/loader";
import {
  CheckCircle2,
  Tag,
  Briefcase,
  FileText,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveVotingRecord } from "@/lib/votingHistory";
import { Candidate } from "@/lib/activities";
import { useActivity, useUser } from "@/hooks";

export default function VotingPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const { activity, loading, error: activityError } = useActivity(activityId, true);
  const { user } = useUser();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Vote state
  const [chooseAllVotes, setChooseAllVotes] = useState<Record<string, string>>(
    {},
  );
  const [chooseOneVote, setChooseOneVote] = useState<string>("");

  useEffect(() => {
    // Initialize vote state for choose_all when activity loads
    if (activity && activity.rule === "choose_all") {
      const initialVotes: Record<string, string> = {};
      activity.options.forEach((option) => {
        initialVotes[option._id] = "我沒有意見";
      });
      setChooseAllVotes(initialVotes);
    }
  }, [activity]);

  const handleChooseAllChange = (optionId: string, remark: string) => {
    setChooseAllVotes((prev) => ({
      ...prev,
      [optionId]: remark,
    }));
  };

  const handleSubmitVote = async () => {
    if (!activity) return;

    // Validate vote
    if (activity.rule === "choose_one" && !chooseOneVote) {
      setError("請選擇一個選項");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const voteData = {
        activity_id: activityId,
        rule: activity.rule,
        ...(activity.rule === "choose_all"
          ? {
              choose_all: Object.entries(chooseAllVotes).map(
                ([option_id, remark]) => ({
                  option_id,
                  remark,
                }),
              ),
            }
          : {
              choose_one: chooseOneVote,
            }),
      };

      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(voteData),
      });

      const data = await response.json();

      if (data.success) {
        saveVotingRecord(
          activityId,
          data.data.token,
          activity.name,
          user?.student_id || "",
        );

        // Redirect to completion page
        router.push(
          `/vote/${activityId}/completion?token=${data.data.token}&name=${encodeURIComponent(activity.name)}`,
        );
      } else {
        setError(data.error || "投票失敗");
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError("投票時發生錯誤");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCandidate = (candidate: Candidate, role?: string) => {
    return (
      <Card className="mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start gap-4">
            {candidate.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={candidate.avatar_url}
                alt={candidate.name}
                className="h-20 w-20 flex-shrink-0 rounded-full border-4 border-white object-cover shadow-lg"
              />
            )}
            <div className="flex-1">
              {role && (
                <Badge variant="default" className="mb-2">
                  {role}
                </Badge>
              )}
              <h4 className="mb-1 text-xl font-bold">{candidate.name}</h4>
              {(candidate.department || candidate.college) && (
                <>
                  {candidate.department && (
                    <p className="text-sm font-medium text-primary">
                      {candidate.department}
                    </p>
                  )}
                  {candidate.college && (
                    <p className="text-sm text-muted-foreground">
                      {candidate.college}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {candidate.personal_experiences &&
            candidate.personal_experiences.length > 0 && (
              <div className="mb-3 rounded-lg bg-white/80 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold">經歷</p>
                </div>
                <ul className="space-y-1">
                  {candidate.personal_experiences.map(
                    (exp: string, idx: number) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="mr-2 text-primary">•</span>
                        <span>{exp}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

          {candidate.political_opinions &&
            candidate.political_opinions.length > 0 && (
              <div className="rounded-lg bg-white/80 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold">政見</p>
                </div>
                <ul className="space-y-1">
                  {candidate.political_opinions.map(
                    (opinion: string, idx: number) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="mr-2 text-primary">•</span>
                        <span>{opinion}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loading text="載入中..." />
      </div>
    );
  }

  if (!activity || activityError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="mb-4 text-2xl font-bold">找不到投票活動</h2>
            <Button onClick={() => router.push("/vote")}>返回投票列表</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">{activity.name}</CardTitle>
              {activity.description && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {activity.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-primary" />
                  <span>類型：{activity.type}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                  <span>
                    投票方式：
                    {activity.rule === "choose_all" ? "多選評分" : "單選"}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          {activity.rule === "choose_all" && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <Badge
                  variant="outline"
                  className="w-full justify-start text-sm"
                >
                  <strong className="mr-2">投票說明：</strong>
                  請對每位候選人表達您的意見（支持、反對或無意見）
                </Badge>
              </CardContent>
            </>
          )}
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Options/Candidates */}
        <div className="mb-8 space-y-6">
          {activity.options.map((option, index) => (
            <Card key={option._id}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {option.label || `候選人 ${index + 1}`}
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                {option.candidate && renderCandidate(option.candidate)}
                {option.vice1 && renderCandidate(option.vice1)}
                {option.vice2 && renderCandidate(option.vice2)}

                {/* Vote Selection */}
                <div className="mt-6 border-t pt-6">
                  <p className="mb-3 text-sm font-semibold">您的選擇：</p>
                  {activity.rule === "choose_all" ? (
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={() =>
                          handleChooseAllChange(option._id, "我要投給他")
                        }
                        variant={
                          chooseAllVotes[option._id] === "我要投給他"
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          "flex-1",
                          chooseAllVotes[option._id] === "我要投給他" &&
                            "bg-green-600 hover:bg-green-700 text-white border-green-600",
                        )}
                      >
                        我要投給他
                      </Button>
                      <Button
                        onClick={() =>
                          handleChooseAllChange(option._id, "我不投給他")
                        }
                        variant={
                          chooseAllVotes[option._id] === "我不投給他"
                            ? "destructive"
                            : "outline"
                        }
                        className="flex-1"
                      >
                        我不投給他
                      </Button>
                      <Button
                        onClick={() =>
                          handleChooseAllChange(option._id, "我沒有意見")
                        }
                        variant={
                          chooseAllVotes[option._id] === "我沒有意見"
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          "flex-1",
                          chooseAllVotes[option._id] === "我沒有意見" &&
                            "bg-gray-500 hover:bg-gray-600 text-white",
                        )}
                      >
                        我沒有意見
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setChooseOneVote(option._id)}
                      variant={
                        chooseOneVote === option._id ? "default" : "outline"
                      }
                      className="w-full"
                      size="lg"
                    >
                      {chooseOneVote === option._id
                        ? "✓ 已選擇"
                        : "選擇此候選人"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            onClick={() => router.push("/vote")}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <Button
            onClick={handleSubmitVote}
            size="lg"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "提交中..." : "確認投票"}
          </Button>
        </div>
      </div>
    </div>
  );
}
