"use client";

import { FileText } from "lucide-react";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

/* ============================================
   樣板管理頁面
   用於管理訊息樣板的主頁面
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
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        {/* 頁面圖示 */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* 頁面標題 */}
        <h1 className="text-2xl font-bold text-foreground">樣板管理</h1>

        {/* 頁面說明 */}
        <p className="mt-2 text-muted-foreground">
          這裡將會是樣板管理的頁面
        </p>
      </div>
    </div>
  );
}
