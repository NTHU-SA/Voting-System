"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  RefreshCw,
  ClipboardList,
  CheckCircle,
  Clock,
  Edit,
  BarChart3,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";
import { useAdminAccess, useAdminActivities, useActivityStatusBadge, getActivityStatusType } from "@/hooks";

function AdminDashboardContent() {
  const { activities, loading, error, refetch } = useAdminActivities();
  const { getStatusBadge } = useActivityStatusBadge();

  // Check admin access and fetch activities on success
  useAdminAccess();

  const activeCount = activities.filter((a) => 
    getActivityStatusType(a) === "active"
  ).length;

  const completedCount = activities.filter(
    (a) => getActivityStatusType(a) === "ended"
  ).length;

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

      <main className="container mx-auto max-w-7xl px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h2 className="mb-2 text-4xl font-bold">管理員後台</h2>
          <p className="text-muted-foreground">投票系統管理控制台</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    總活動數
                  </p>
                  <p className="text-4xl font-bold">{activities.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-primary-foreground">
                    進行中
                  </p>
                  <p className="text-4xl font-bold text-green-600">
                    {activeCount}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    已結束
                  </p>
                  <p className="text-4xl font-bold text-muted-foreground">
                    {completedCount}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button size="lg" asChild>
                <Link href="/admin/activities/new">
                  <Plus className="mr-2 h-4 w-4" />
                  新增投票活動
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                重新整理
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activities Table */}
        <Card>
          <CardHeader>
            <CardTitle>投票活動列表</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {activities.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="mb-6 text-lg text-muted-foreground">
                  目前沒有任何投票活動
                </p>
                <Button asChild>
                  <Link href="/admin/activities/new">
                    <Plus className="mr-2 h-4 w-4" />
                    新增第一個活動
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>活動名稱</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>投票方式</TableHead>
                    <TableHead>候選人數</TableHead>
                    <TableHead>已投票</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={String(activity._id)}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{activity.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {activity.type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(activity)}</TableCell>
                      <TableCell className="text-sm">
                        {activity.rule === "choose_all" ? "多選評分" : "單選"}
                      </TableCell>
                      <TableCell>{activity.options?.length || 0}</TableCell>
                      <TableCell>{activity.users?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/activities/${activity._id}`}>
                              <Edit className="mr-1 h-3 w-3" />
                              管理
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/admin/activities/${activity._id}/results`}
                            >
                              <BarChart3 className="mr-1 h-3 w-3" />
                              統計
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/admin/activities/${activity._id}/verification`}
                            >
                              <ClipboardCheck className="mr-1 h-3 w-3" />
                              驗票
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}
