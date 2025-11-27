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

/* ============================================
   模擬資料 - 之後會替換為實際 API 呼叫
   ============================================ */
const MOCK_WEBHOOKS: (WebhookItem & { url?: string; createdAt?: string })[] = [
  {
    id: "1",
    name: "通知頻道",
    isActive: true,
    lastUsed: "2024-01-15T10:30:00Z",
    successCount: 156,
    failCount: 2,
    url: "https://discord.com/api/webhooks/1234567890/abcdef",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "警報系統",
    isActive: true,
    lastUsed: "2024-01-14T18:45:00Z",
    successCount: 89,
    failCount: 0,
    url: "https://discord.com/api/webhooks/0987654321/ghijkl",
    createdAt: "2024-01-05T00:00:00Z",
  },
  {
    id: "3",
    name: "每日報告",
    isActive: false,
    lastUsed: "2024-01-10T09:00:00Z",
    successCount: 30,
    failCount: 5,
    url: "https://discord.com/api/webhooks/1122334455/mnopqr",
    createdAt: "2024-01-08T00:00:00Z",
  },
];

/* ============================================
   首頁元件
   整合側邊欄與主內容區的佈局
   ============================================ */
export default function Home() {
  // 使用模擬資料，之後替換為實際 API
  const [webhooks, setWebhooks] = React.useState(MOCK_WEBHOOKS);
  const [selectedId, setSelectedId] = React.useState<string | undefined>();

  // 找到目前選中的 Webhook
  const selectedWebhook = React.useMemo(
    () => webhooks.find((w) => w.id === selectedId),
    [webhooks, selectedId]
  );

  /* 事件處理函式 - 之後會連接實際 API */
  const handleAddWebhook = () => {
    console.log("新增 Webhook");
    // TODO: 開啟新增對話框
  };

  const handleEditWebhook = (id: string) => {
    console.log("編輯 Webhook:", id);
    // TODO: 開啟編輯對話框
  };

  const handleDeleteWebhook = (id: string) => {
    console.log("刪除 Webhook:", id);
    // TODO: 開啟確認對話框，執行刪除
  };

  const handleTestSend = (id: string) => {
    console.log("測試發送:", id);
    // TODO: 執行測試發送
  };

  const handleToggleActive = (isActive: boolean) => {
    if (selectedId) {
      setWebhooks((prev) =>
        prev.map((w) => (w.id === selectedId ? { ...w, isActive } : w))
      );
    }
  };

  // 判斷是否為空狀態（沒有任何 Webhook）
  const isEmpty = webhooks.length === 0;

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
    </SidebarProvider>
  );
}
