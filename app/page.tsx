"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  WebhookSidebar,
  type WebhookItem,
} from "@/components/layout/WebhookSidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { WebhookDetail } from "@/components/webhook/WebhookDetail";
import { EmptyState } from "@/components/webhook/EmptyState";
import { NoSelectionState } from "@/components/webhook/NoSelectionState";
import {
  WebhookFormDialog,
  type WebhookFormData,
} from "@/components/webhook/WebhookFormDialog";
import { DeleteConfirmDialog } from "@/components/webhook/DeleteConfirmDialog";
import { toast } from "sonner";

/* ============================================
   Webhook 完整資料型別（包含 API 回傳的所有欄位）
   ============================================ */
interface WebhookData extends WebhookItem {
  url: string;
  createdAt: string;
  updatedAt: string;
}

/* ============================================
   首頁元件
   整合側邊欄與主內容區的佈局
   ============================================ */
export default function Home() {
  // Webhook 列表狀態
  const [webhooks, setWebhooks] = React.useState<WebhookData[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | undefined>();
  const [isLoading, setIsLoading] = React.useState(true);

  // 對話框狀態
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [editingWebhook, setEditingWebhook] = React.useState<
    WebhookData | undefined
  >();
  const [deletingWebhook, setDeletingWebhook] = React.useState<
    WebhookData | undefined
  >();

  // 找到目前選中的 Webhook
  const selectedWebhook = React.useMemo(
    () => webhooks.find((w) => w.id === selectedId),
    [webhooks, selectedId]
  );

  /* ============================================
     API 呼叫函式
     ============================================ */

  // 載入所有 Webhooks
  const fetchWebhooks = React.useCallback(async () => {
    try {
      const response = await fetch("/api/webhooks");
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error("載入 Webhooks 失敗:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始載入
  React.useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  /* ============================================
     事件處理函式
     ============================================ */

  // 開啟新增對話框
  const handleAddWebhook = () => {
    setEditingWebhook(undefined);
    setIsFormOpen(true);
  };

  // 開啟編輯對話框
  const handleEditWebhook = (id: string) => {
    const webhook = webhooks.find((w) => w.id === id);
    if (webhook) {
      setEditingWebhook(webhook);
      setIsFormOpen(true);
    }
  };

  // 開啟刪除確認對話框
  const handleDeleteWebhook = (id: string) => {
    const webhook = webhooks.find((w) => w.id === id);
    if (webhook) {
      setDeletingWebhook(webhook);
      setIsDeleteOpen(true);
    }
  };

  // 測試發送
  const handleTestSend = async (id: string) => {
    try {
      const response = await fetch(`/api/webhooks/${id}/test`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        // 重新載入 webhooks 以更新統計資料
        await fetchWebhooks();
        toast.success("測試訊息發送成功！", {
          description: "Webhook 已成功發送測試訊息到 Discord",
        });
      } else {
        toast.error("發送失敗", {
          description: result.error || "未知錯誤",
        });
      }
    } catch (error) {
      console.error("測試發送失敗:", error);
      toast.error("發送失敗", {
        description: "網路錯誤，請檢查網路連線後再試",
      });
    }
  };

  // 切換啟用狀態
  const handleToggleActive = async (isActive: boolean) => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/webhooks/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setWebhooks((prev) =>
          prev.map((w) => (w.id === selectedId ? { ...w, isActive } : w))
        );
      }
    } catch (error) {
      console.error("更新狀態失敗:", error);
    }
  };

  // 提交表單（新增或編輯）
  const handleFormSubmit = async (data: WebhookFormData) => {
    if (editingWebhook) {
      // 編輯模式
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
      // 新增模式
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

  // 判斷是否為空狀態（沒有任何 Webhook）
  const isEmpty = webhooks.length === 0;

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#313338]">
        <div className="text-[#b5bac1]">載入中...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      {/* 側邊欄 - 當有 Webhook 時顯示 */}
      {!isEmpty && (
        <WebhookSidebar
          webhooks={webhooks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={handleAddWebhook}
          onEdit={handleEditWebhook}
          onDelete={handleDeleteWebhook}
          onTestSend={handleTestSend}
        />
      )}

      {/* 主內容區 */}
      <SidebarInset className="flex min-h-screen flex-col">
        {/* 行動裝置專用頂部導覽列 */}
        {!isEmpty && <MobileHeader />}

        {/* 主要內容 */}
        <div className="flex-1">
          {isEmpty ? (
            // 空狀態：歡迎頁面
            <EmptyState onAddWebhook={handleAddWebhook} />
          ) : selectedWebhook ? (
            // 有選中的 Webhook：顯示詳細資訊
            <WebhookDetail
              webhook={selectedWebhook}
              onEdit={() => handleEditWebhook(selectedWebhook.id)}
              onDelete={() => handleDeleteWebhook(selectedWebhook.id)}
              onTestSend={() => handleTestSend(selectedWebhook.id)}
              onToggleActive={handleToggleActive}
            />
          ) : (
            // 尚未選擇：提示選擇 Webhook
            <NoSelectionState />
          )}
        </div>
      </SidebarInset>

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
    </SidebarProvider>
  );
}
