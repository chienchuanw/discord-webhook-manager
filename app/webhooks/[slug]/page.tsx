"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WebhookDetail } from "@/components/webhook/WebhookDetail";
import {
  WebhookFormDialog,
  type WebhookFormData,
} from "@/components/webhook/WebhookFormDialog";
import { DeleteConfirmDialog } from "@/components/webhook/DeleteConfirmDialog";

/* ============================================
   Webhook 動態路由頁面
   顯示指定 slug 的 Webhook 詳細資訊
   ============================================ */
export default function WebhookPage() {
  return (
    <DashboardProvider>
      <DashboardLayout>
        <WebhookPageContent />
      </DashboardLayout>
    </DashboardProvider>
  );
}

/* ============================================
   WebhookPageContent 元件
   動態路由頁面的實際內容
   ============================================ */
function WebhookPageContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const {
    webhooks,
    setWebhooks,
    isLoading,
    handleTestSend,
    handleToggleActive,
    registerDialogHandlers,
  } = useDashboard();

  // 對話框狀態
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  // 根據 slug 找到對應的 webhook
  const webhook = React.useMemo(
    () => webhooks.find((w) => w.id === slug),
    [webhooks, slug]
  );

  // 註冊對話框處理函式給 Context 使用
  React.useEffect(() => {
    registerDialogHandlers({
      onAdd: () => {
        setIsFormOpen(true);
      },
      onEdit: (id: string) => {
        if (id === slug) {
          setIsFormOpen(true);
        }
      },
      onDelete: (id: string) => {
        if (id === slug) {
          setIsDeleteOpen(true);
        }
      },
    });
  }, [registerDialogHandlers, slug]);

  // 提交表單（編輯）
  const handleFormSubmit = async (data: WebhookFormData) => {
    if (!webhook) return;

    const response = await fetch(`/api/webhooks/${webhook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const updated = await response.json();
      setWebhooks((prev) =>
        prev.map((w) => (w.id === webhook.id ? updated : w))
      );
    }
  };

  // 確認刪除
  const handleConfirmDelete = async () => {
    if (!webhook) return;

    const response = await fetch(`/api/webhooks/${webhook.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setWebhooks((prev) => prev.filter((w) => w.id !== webhook.id));
      // 刪除後導航回首頁
      router.push("/");
    }
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }

  // 找不到 webhook
  if (!webhook) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-xl font-semibold text-foreground">
          找不到此 Webhook
        </div>
        <p className="text-muted-foreground">
          該 Webhook 可能已被刪除或不存在
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-primary hover:underline"
        >
          返回首頁
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Webhook 詳情 */}
      <WebhookDetail
        webhook={webhook}
        onEdit={() => setIsFormOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
        onTestSend={() => handleTestSend(webhook.id)}
        onToggleActive={(isActive) => handleToggleActive(webhook.id, isActive)}
      />

      {/* 編輯對話框 */}
      <WebhookFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={{
          name: webhook.name,
          url: webhook.url,
          isActive: webhook.isActive,
        }}
        title="編輯 Webhook"
        description="修改 Webhook 的設定"
      />

      {/* 刪除確認對話框 */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        webhookName={webhook.name}
      />
    </>
  );
}

