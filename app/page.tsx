"use client";

import * as React from "react";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WebhookDetail } from "@/components/webhook/WebhookDetail";
import { EmptyState } from "@/components/webhook/EmptyState";
import { NoSelectionState } from "@/components/webhook/NoSelectionState";
import {
  WebhookFormDialog,
  type WebhookFormData,
} from "@/components/webhook/WebhookFormDialog";
import { DeleteConfirmDialog } from "@/components/webhook/DeleteConfirmDialog";

/* ============================================
   首頁元件
   顯示 Webhook 詳細資訊的主要內容區
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
  const {
    webhooks,
    setWebhooks,
    selectedId,
    setSelectedId,
    handleTestSend,
    handleToggleActive,
    openAddDialog,
    registerDialogHandlers,
  } = useDashboard();

  // 對話框狀態
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [editingWebhook, setEditingWebhook] = React.useState<
    (typeof webhooks)[0] | undefined
  >();
  const [deletingWebhook, setDeletingWebhook] = React.useState<
    (typeof webhooks)[0] | undefined
  >();

  // 找到目前選中的 Webhook
  const selectedWebhook = React.useMemo(
    () => webhooks.find((w) => w.id === selectedId),
    [webhooks, selectedId]
  );

  // 註冊對話框處理函式給 Context 使用
  React.useEffect(() => {
    registerDialogHandlers({
      onAdd: () => {
        setEditingWebhook(undefined);
        setIsFormOpen(true);
      },
      onEdit: (id: string) => {
        const webhook = webhooks.find((w) => w.id === id);
        if (webhook) {
          setEditingWebhook(webhook);
          setIsFormOpen(true);
        }
      },
      onDelete: (id: string) => {
        const webhook = webhooks.find((w) => w.id === id);
        if (webhook) {
          setDeletingWebhook(webhook);
          setIsDeleteOpen(true);
        }
      },
    });
  }, [registerDialogHandlers, webhooks]);

  // 提交表單（新增或編輯）
  const handleFormSubmit = async (data: WebhookFormData) => {
    if (editingWebhook) {
      const response = await fetch(`/api/webhooks/${editingWebhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updated = await response.json();
        setWebhooks((prev) =>
          prev.map((w) => (w.id === editingWebhook.id ? updated : w))
        );
      }
    } else {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const created = await response.json();
        setWebhooks((prev) => [created, ...prev]);
        setSelectedId(created.id);
      }
    }
  };

  // 確認刪除
  const handleConfirmDelete = async () => {
    if (!deletingWebhook) return;

    const response = await fetch(`/api/webhooks/${deletingWebhook.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setWebhooks((prev) => prev.filter((w) => w.id !== deletingWebhook.id));
      if (selectedId === deletingWebhook.id) {
        setSelectedId(undefined);
      }
    }
  };

  // 判斷是否為空狀態
  const isEmpty = webhooks.length === 0;

  return (
    <>
      {/* 主要內容區 */}
      {isEmpty ? (
        <EmptyState onAddWebhook={openAddDialog} />
      ) : selectedWebhook ? (
        <WebhookDetail
          webhook={selectedWebhook}
          onEdit={() => {
            setEditingWebhook(selectedWebhook);
            setIsFormOpen(true);
          }}
          onDelete={() => {
            setDeletingWebhook(selectedWebhook);
            setIsDeleteOpen(true);
          }}
          onTestSend={() => handleTestSend(selectedWebhook.id)}
          onToggleActive={(isActive) =>
            handleToggleActive(selectedWebhook.id, isActive)
          }
        />
      ) : (
        <NoSelectionState />
      )}

      {/* 新增/編輯對話框 */}
      <WebhookFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={
          editingWebhook
            ? {
                name: editingWebhook.name,
                url: editingWebhook.url,
                isActive: editingWebhook.isActive,
              }
            : undefined
        }
        title={editingWebhook ? "編輯 Webhook" : "新增 Webhook"}
        description={
          editingWebhook
            ? "修改 Webhook 的設定"
            : "輸入 Webhook 的名稱和 Discord Webhook URL"
        }
      />

      {/* 刪除確認對話框 */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        webhookName={deletingWebhook?.name ?? ""}
      />
    </>
  );
}
