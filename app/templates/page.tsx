"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TemplateList } from "@/components/template";
import {
  WebhookFormDialog,
  type WebhookFormData,
} from "@/components/webhook/WebhookFormDialog";

/* ============================================
   樣板管理頁面
   用於管理訊息樣板的主頁面
   包含樣板列表、新增/編輯/刪除功能
   ============================================ */
export default function TemplatesPage() {
  return (
    <DashboardProvider>
      <DashboardLayout>
        <TemplatesContent />
      </DashboardLayout>
    </DashboardProvider>
  );
}

/* ============================================
   TemplatesContent 元件
   樣板管理頁面的實際內容
   處理新增 Webhook 對話框
   ============================================ */
function TemplatesContent() {
  const router = useRouter();
  const { setWebhooks, registerDialogHandlers } = useDashboard();
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  // 註冊對話框處理函式，讓 Sidebar 的「新增 Webhook」按鈕能正常運作
  React.useEffect(() => {
    registerDialogHandlers({
      onAdd: () => setIsFormOpen(true),
      onEdit: () => {}, // 在此頁面不需要編輯功能
      onDelete: () => {}, // 在此頁面不需要刪除功能
    });
  }, [registerDialogHandlers]);

  // 處理新增 Webhook 表單提交
  const handleFormSubmit = async (data: WebhookFormData) => {
    // 建立 Webhook
    const response = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        url: data.url,
        isActive: data.isActive,
      }),
    });

    if (response.ok) {
      const newWebhook = await response.json();
      setWebhooks((prev) => [...prev, newWebhook]);

      // 如果有選擇樣板，則套用樣板建立排程
      if (data.templateId) {
        try {
          await fetch(`/api/webhooks/${newWebhook.id}/schedules/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId: data.templateId }),
          });
        } catch (err) {
          console.error("套用樣板失敗:", err);
        }
      }

      // 導向新建立的 Webhook 詳情頁
      router.push(`/webhooks/${newWebhook.id}`);
    }
  };

  return (
    <div className="h-full p-6">
      <TemplateList />

      {/* 新增 Webhook 對話框 */}
      <WebhookFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        title="新增 Webhook"
        description="輸入 Webhook 的名稱和 Discord Webhook URL"
      />
    </div>
  );
}
