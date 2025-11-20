"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loader";

function MockAuthContent() {
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get("redirect_uri");
  const clientId = searchParams.get("client_id");
  const scope = searchParams.get("scope") || "userid name inschool uuid";
  const state = searchParams.get("state");

  const [formData, setFormData] = useState({
    userid: "110000114",
    name: "測試學生",
    inschool: "true",
    uuid: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redirectUri) return;

    setIsSubmitting(true);

    try {
      // Generate UUID if not provided
      const uuid = formData.uuid || `mock-uuid-${Date.now()}`;

      // Prepare data based on requested scope
      const scopeFields = scope.split(" ");
      const mockData: Record<string, string> = {
        timestamp: Date.now().toString(),
      };

      // Only include fields that are in the requested scope
      if (scopeFields.includes("userid")) {
        mockData.Userid = formData.userid;
      }
      if (scopeFields.includes("name")) {
        mockData.name = formData.name;
      }
      if (scopeFields.includes("inschool")) {
        mockData.inschool = formData.inschool;
      }
      if (scopeFields.includes("uuid")) {
        mockData.uuid = uuid;
      }

      // Generate authorization code
      const code = crypto.randomUUID();

      // Store the data via server endpoint to set httpOnly cookie
      const storeResponse = await fetch("/api/mock/authorize/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, mockData, redirectUri }),
      });

      if (!storeResponse.ok) {
        throw new Error("Failed to store authorization data");
      }

      // Redirect to callback with code and state
      const callbackUrl = new URL(redirectUri);
      callbackUrl.searchParams.set("code", code);
      if (state) {
        callbackUrl.searchParams.set("state", state);
      }
      window.location.href = callbackUrl.toString();
    } catch (error) {
      console.error("Error during mock OAuth:", error);
      setIsSubmitting(false);
    }
  };

  if (!redirectUri) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-xl text-destructive">
            錯誤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            缺少 redirect_uri 參數
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isSubmitting) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-xl">處理中</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <Loading text="正在授權..." />
        </CardContent>
      </Card>
    );
  }

  const scopeFields = scope.split(" ");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Mock OAuth 授權</CardTitle>
        <CardDescription className="text-center">
          應用程式:{" "}
          <span className="font-semibold">{clientId || "nthusa"}</span>
          <br />
          請求權限: <span className="font-semibold">{scope}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {scopeFields.includes("userid") && (
            <div className="space-y-2">
              <Label htmlFor="userid">學號 (Userid) *</Label>
              <Input
                id="userid"
                type="text"
                value={formData.userid}
                onChange={(e) =>
                  setFormData({ ...formData, userid: e.target.value })
                }
                placeholder="請輸入學號"
                required
              />
            </div>
          )}

          {scopeFields.includes("name") && (
            <div className="space-y-2">
              <Label htmlFor="name">姓名 (Name)</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="請輸入姓名"
              />
            </div>
          )}

          {scopeFields.includes("inschool") && (
            <div className="space-y-2">
              <Label htmlFor="inschool">在學狀態 (Inschool)</Label>
              <select
                id="inschool"
                value={formData.inschool}
                onChange={(e) =>
                  setFormData({ ...formData, inschool: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="true">在學 (true)</option>
                <option value="false">不在學 (false)</option>
              </select>
            </div>
          )}

          {scopeFields.includes("uuid") && (
            <div className="space-y-2">
              <Label htmlFor="uuid">UUID (選填)</Label>
              <Input
                id="uuid"
                type="text"
                value={formData.uuid}
                onChange={(e) =>
                  setFormData({ ...formData, uuid: e.target.value })
                }
                placeholder="留空自動生成"
              />
              <p className="text-xs text-muted-foreground">
                留空將自動生成 UUID
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              授權並繼續
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (redirectUri) {
                  const callbackUrl = new URL(redirectUri);
                  callbackUrl.searchParams.set("error", "access_denied");
                  window.location.href = callbackUrl.toString();
                }
              }}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function MockAuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<Loading text="載入中..." />}>
        <MockAuthContent />
      </Suspense>
    </div>
  );
}
