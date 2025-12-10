"use client";

import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WebhookSidebar } from "@/components/layout/WebhookSidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { TitleBar } from "@/components/layout/TitleBar";
import { useDashboard } from "@/contexts/DashboardContext";

/* ============================================
   DashboardLayout 元件
   包含側邊欄的共用佈局，用於所有需要 sidebar 的頁面
   ============================================ */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const {
    webhooks,
    isLoading,
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    handleTestSend,
  } = useDashboard();

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
    <div className="flex h-screen flex-col">
      {/* 頂部標題列 - 提供視窗拖拉功能 */}
      <TitleBar />

      {/* 主要內容區域（側邊欄 + 內容） */}
      <SidebarProvider>
        {/* 側邊欄 - 當有 Webhook 時顯示 */}
        {!isEmpty && (
          <WebhookSidebar
            webhooks={webhooks}
            onAdd={openAddDialog}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onTestSend={handleTestSend}
          />
        )}

        {/* 主內容區 */}
        <main className="flex flex-1 flex-col overflow-hidden bg-background">
          {/* 行動裝置專用頂部導覽列 */}
          {!isEmpty && <MobileHeader />}

          {/* 子頁面內容 */}
          <div className="min-h-0 flex-1">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
}
