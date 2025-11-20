"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loader";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    // Auto-redirect to OAuth login
    window.location.href =
      "/api/auth/login" +
      (redirect ? `?redirect=${encodeURIComponent(redirect)}` : "");
  }, [redirect]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">登入系統</CardTitle>
      </CardHeader>
      <CardContent className="py-12">
        <Loading text="正在重定向到登入頁面..." />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<Loading text="載入中..." />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
