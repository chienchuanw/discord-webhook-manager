"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState } from "@/components/webhook/EmptyState";
import { NoSelectionState } from "@/components/webhook/NoSelectionState";
import {
  WebhookFormDialog,
  type WebhookFormData,
} from "@/components/webhook/WebhookFormDialog";

/* ============================================
   首頁元件
   顯示「請選擇 Webhook」提示或空狀態
   ============================================ */
export default function Home() {
  return (
    <DashboardProvider>
      <DashboardLayout>
        <HomeContent />
      </DashboardLayout>
    </DashboardProvider>
  );
}

/* ============================================
   HomeContent 元件
   首頁的實際內容，使用 DashboardContext
   ============================================ */
function HomeContent() {
  const router = useRouter();
  const { webhooks, setWebhooks, openAddDialog, registerDialogHandlers } =
    useDashboard();

  // 新增 Webhook 對話框狀態
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  // 註冊對話框處理函式給 Context 使用
  React.useEffect(() => {
    registerDialogHandlers({
      onAdd: () => {
        setIsFormOpen(true);
      },
      onEdit: (id: string) => {
        // 編輯時導航到 webhook 頁面
        router.push(`/webhooks/${id}`);
      },
      onDelete: (id: string) => {
        // 刪除時也導航到 webhook 頁面處理
        router.push(`/webhooks/${id}`);
      },
    });
  }, [registerDialogHandlers, router]);

  // 提交表單（新增 Webhook）
  const handleFormSubmit = async (data: WebhookFormData) => {
    const response = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const created = await response.json();
      setWebhooks((prev) => [created, ...prev]);
      // 新增後導航到該 webhook 頁面
      router.push(`/webhooks/${created.id}`);
    }
  };

  // 判斷是否為空狀態
  const isEmpty = webhooks.length === 0;

  return (
    <>
      {/* 主要內容區：空狀態或請選擇 Webhook 提示 */}
      {isEmpty ? (
        <EmptyState onAddWebhook={openAddDialog} />
      ) : (
        <NoSelectionState />
      )}

      {/* 新增 Webhook 對話框 */}
      <WebhookFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        title="新增 Webhook"
        description="輸入 Webhook 的名稱和 Discord Webhook URL"
      />
    </>
  );
}
