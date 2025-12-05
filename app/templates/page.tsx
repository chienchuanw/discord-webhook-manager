"use client";

import { DashboardProvider } from "@/contexts/DashboardContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TemplateList } from "@/components/template";

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
   ============================================ */
function TemplatesContent() {
  return (
    <div className="h-full p-6">
      <TemplateList />
    </div>
  );
}
