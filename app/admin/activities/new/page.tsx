"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
} from "lucide-react";
import { useOptionForm } from "../_components/useOptionForm";
import { OptionFormSection } from "../_components/OptionFormSection";
import { ActivityFormFields } from "../_components/ActivityFormFields";
import { buildOptionPayload } from "../_components/utils";

function NewActivityWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Activity info
  const [activityData, setActivityData] = useState({
    name: "",
    type: "",
    description: "",
    rule: "choose_one" as "choose_one" | "choose_all",
    open_from: "",
    open_to: "",
  });

  // Step 2: Options/Candidates - using custom hook
  const optionFormHook = useOptionForm();
  const { options } = optionFormHook;

  // Check admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();

        if (!data.authenticated || !data.user?.isAdmin) {
          router.push("/?error=admin_required");
          return;
        }
      } catch (err) {
        console.error("Error checking admin access:", err);
        router.push("/?error=auth_failed");
      }
    };
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivityChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setActivityData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (
      !activityData.name ||
      !activityData.type ||
      !activityData.open_from ||
      !activityData.open_to
    ) {
      setError("請填寫所有必填欄位");
      return false;
    }

    const openFrom = new Date(activityData.open_from);
    const openTo = new Date(activityData.open_to);
    if (openFrom >= openTo) {
      setError("結束時間必須晚於開始時間");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    }
  };

  const handleSubmit = async () => {
    if (options.length === 0) {
      setError("請至少新增一個候選人");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create activity
      const activityResponse = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(activityData),
      });

      const activityResult = await activityResponse.json();

      if (!activityResult.success) {
        setError(activityResult.error || "建立活動失敗");
        setLoading(false);
        return;
      }

      const activityId = activityResult.data._id;

      // Create options
      for (const option of options) {
        const optionData = buildOptionPayload(option);
        optionData.activity_id = activityId;

        await fetch("/api/options", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(optionData),
        });
      }

      router.push(`/admin/activities/${activityId}`);
    } catch (err) {
      console.error("Error creating activity:", err);
      setError("建立活動時發生錯誤");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回後台
            </Link>
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > 1 ? <Check className="h-5 w-5" /> : "1"}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium">步驟 1</p>
                <p className="text-xs text-muted-foreground">活動基本資訊</p>
              </div>
            </div>

            <div className="h-px flex-1 mx-4 bg-border"></div>

            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium">步驟 2</p>
                <p className="text-xs text-muted-foreground">新增候選人</p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 ? "活動基本資訊" : "新增候選人"}
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <ActivityFormFields
                  formData={activityData}
                  onChange={handleActivityChange}
                />

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1"
                  >
                    下一步：新增候選人
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <OptionFormSection
                  options={optionFormHook.options}
                  currentOption={optionFormHook.currentOption}
                  setCurrentOption={optionFormHook.setCurrentOption}
                  editingIndex={optionFormHook.editingIndex}
                  updateCandidate={optionFormHook.updateCandidate}
                  addVice={optionFormHook.addVice}
                  removeVice={optionFormHook.removeVice}
                  updateVice={optionFormHook.updateVice}
                  addOrUpdateOption={optionFormHook.addOrUpdateOption}
                  editOption={optionFormHook.editOption}
                  removeOption={optionFormHook.removeOption}
                  resetForm={optionFormHook.resetForm}
                />

                <Separator />

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || options.length === 0}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loading />
                        <span className="ml-2">建立中...</span>
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        完成建立
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function NewActivityWizardPage() {
  return <NewActivityWizard />;
}
