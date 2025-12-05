"use client";

import * as React from "react";
import { Plus, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  WebhookScheduleCard,
  type WebhookScheduleData,
} from "./WebhookScheduleCard";
import { ApplyTemplateDialog } from "./ApplyTemplateDialog";
import {
  WebhookScheduleFormDialog,
  type ScheduleFormData,
} from "./WebhookScheduleFormDialog";

/* ============================================
   WebhookScheduleList 元件
   顯示並管理 Webhook 的排程列表
   ============================================ */

interface WebhookScheduleListProps {
  webhookId: string;
}

export function WebhookScheduleList({ webhookId }: WebhookScheduleListProps) {
  const [schedules, setSchedules] = React.useState<WebhookScheduleData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 對話框狀態
  const [applyTemplateOpen, setApplyTemplateOpen] = React.useState(false);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] =
    React.useState<WebhookScheduleData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingSchedule, setDeletingSchedule] =
    React.useState<WebhookScheduleData | null>(null);

  // 載入排程列表
  const fetchSchedules = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/webhooks/${webhookId}/schedules`);
      if (!res.ok) throw new Error("載入失敗");
      const data = await res.json();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setIsLoading(false);
    }
  }, [webhookId]);

  React.useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 建立排程
  const handleCreate = async (data: ScheduleFormData) => {
    const res = await fetch(`/api/webhooks/${webhookId}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "建立失敗");
    }
    await fetchSchedules();
  };

  // 更新排程
  const handleUpdate = async (data: ScheduleFormData) => {
    if (!editingSchedule) return;
    const res = await fetch(
      `/api/webhooks/${webhookId}/schedules/${editingSchedule.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "更新失敗");
    }
    await fetchSchedules();
    setEditingSchedule(null);
  };

  // 刪除排程
  const handleDelete = async () => {
    if (!deletingSchedule) return;
    const res = await fetch(
      `/api/webhooks/${webhookId}/schedules/${deletingSchedule.id}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "刪除失敗");
    }
    await fetchSchedules();
    setDeletingSchedule(null);
    setDeleteDialogOpen(false);
  };

  // 切換啟用狀態
  const handleToggleActive = async (schedule: WebhookScheduleData) => {
    const res = await fetch(
      `/api/webhooks/${webhookId}/schedules/${schedule.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      }
    );
    if (res.ok) {
      await fetchSchedules();
    }
  };

  // 開啟編輯對話框
  const handleEdit = (schedule: WebhookScheduleData) => {
    setEditingSchedule(schedule);
    setFormDialogOpen(true);
  };

  // 開啟刪除確認
  const handleDeleteClick = (schedule: WebhookScheduleData) => {
    setDeletingSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  // 關閉表單對話框
  const handleFormClose = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) setEditingSchedule(null);
  };

  // 轉換為表單資料
  const getFormData = (
    schedule: WebhookScheduleData | null
  ): ScheduleFormData | undefined => {
    if (!schedule) return undefined;
    return {
      name: schedule.name,
      messageContent: schedule.messageContent,
      embedData: schedule.embedData,
      imageUrl: schedule.imageUrl,
      scheduleType: schedule.scheduleType,
      intervalMinutes: schedule.intervalMinutes,
      scheduleTime: schedule.scheduleTime,
      scheduleDays: schedule.scheduleDays,
      isActive: schedule.isActive,
    };
  };

  return (
    <div className="space-y-4">
      {/* 標題與操作按鈕 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">排程管理</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSchedules}
            disabled={isLoading}
            className="text-[#b5bac1] hover:bg-[#4e5058] hover:text-white"
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            重新整理
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setApplyTemplateOpen(true)}
            className="border-[#5865f2] bg-transparent text-[#5865f2] hover:bg-[#5865f2]/10"
          >
            <FileText className="mr-1 h-4 w-4" />
            套用樣板
          </Button>
          <Button
            size="sm"
            onClick={() => setFormDialogOpen(true)}
            className="bg-[#5865f2] text-white hover:bg-[#4752c4]"
          >
            <Plus className="mr-1 h-4 w-4" />
            新增排程
          </Button>
        </div>
      </div>

      {/* 載入狀態 */}
      {isLoading && schedules.length === 0 && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-[#1e1f22] bg-[#2b2d31]">
          <p className="text-[#b5bac1]">載入中...</p>
        </div>
      )}

      {/* 錯誤狀態 */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* 空狀態 */}
      {!isLoading && !error && schedules.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[#404249] bg-[#2b2d31]">
          <FileText className="mb-3 h-10 w-10 text-[#949ba4]" />
          <p className="mb-1 text-[#b5bac1]">尚無排程</p>
          <p className="mb-4 text-sm text-[#949ba4]">建立排程來自動發送訊息</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApplyTemplateOpen(true)}
              className="border-[#5865f2] bg-transparent text-[#5865f2] hover:bg-[#5865f2]/10"
            >
              套用樣板
            </Button>
            <Button
              size="sm"
              onClick={() => setFormDialogOpen(true)}
              className="bg-[#5865f2] text-white hover:bg-[#4752c4]"
            >
              新增排程
            </Button>
          </div>
        </div>
      )}

      {/* 排程列表 */}
      {schedules.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {schedules.map((schedule) => (
            <WebhookScheduleCard
              key={schedule.id}
              schedule={schedule}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* 套用樣板對話框 */}
      <ApplyTemplateDialog
        open={applyTemplateOpen}
        onOpenChange={setApplyTemplateOpen}
        webhookId={webhookId}
        onApplied={fetchSchedules}
      />

      {/* 新增/編輯排程對話框 */}
      <WebhookScheduleFormDialog
        open={formDialogOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingSchedule ? handleUpdate : handleCreate}
        initialData={getFormData(editingSchedule)}
        title={editingSchedule ? "編輯排程" : "新增排程"}
        description={
          editingSchedule ? "修改排程的內容與設定" : "建立一個新的自動發送排程"
        }
      />

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-[#1e1f22] bg-[#313338]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              確定要刪除此排程？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#b5bac1]">
              此操作無法復原。排程「{deletingSchedule?.name}」將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e1f22] bg-transparent text-white hover:bg-[#4e5058]">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
