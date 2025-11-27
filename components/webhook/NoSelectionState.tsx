"use client";

import { MousePointerClick } from "lucide-react";

/* ============================================
   NoSelectionState 元件
   當使用者有 Webhook 但尚未選擇任何一個時顯示
   ============================================ */
export function NoSelectionState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        {/* 圖示 */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <MousePointerClick className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* 提示文字 */}
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          選擇一個 Webhook
        </h2>
        <p className="text-sm text-muted-foreground">
          從左側選單選擇一個 Webhook 來查看詳細資訊，
          或者點擊 + 按鈕新增一個新的 Webhook。
        </p>
      </div>
    </div>
  );
}

