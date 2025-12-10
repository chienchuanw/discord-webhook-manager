"use client";

import { Plus, Sparkles } from "lucide-react";
import { DiscordIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

/* ============================================
   EmptyState 元件
   當使用者還沒有建立任何 Webhook 時顯示的歡迎頁面
   採用 Discord 風格的設計
   ============================================ */
interface EmptyStateProps {
  onAddWebhook: () => void;
}

export function EmptyState({ onAddWebhook }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      {/* 主要內容區塊 */}
      <div className="flex max-w-md flex-col items-center text-center">
        {/* Discord 風格的圖示裝飾 */}
        <div className="relative mb-8">
          {/* 背景光暈效果 */}
          <div className="absolute inset-0 rounded-full bg-discord-blurple/20 blur-xl" />

          {/* 主圖示容器 */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-discord-blurple to-[#4752c4]">
            <DiscordIcon className="h-12 w-12 text-white" />
          </div>

          {/* 裝飾星星 */}
          <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-gray-200" />
        </div>

        {/* 歡迎標題 */}
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          歡迎使用 Webhook Manager
        </h1>

        {/* 說明文字 */}
        <p className="mb-8 text-muted-foreground">
          開始建立你的第一個 Discord Webhook，輕鬆管理訊息發送與排程任務。
        </p>

        {/* 功能說明列表 */}
        <div className="mb-8 grid w-full gap-3 text-left">
          <FeatureItem
            title="管理多個 Webhook"
            description="集中管理所有 Discord Webhook 設定"
          />
          <FeatureItem
            title="排程發送"
            description="設定自動化訊息排程，定時發送通知"
          />
        </div>

        {/* 新增按鈕 */}
        <Button
          size="lg"
          onClick={onAddWebhook}
          className="gap-2 bg-discord-blurple text-white hover:bg-discord-blurple/90 hover:cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          建立 Webhook
        </Button>
      </div>
    </div>
  );
}

/* ============================================
   FeatureItem 子元件
   顯示單一功能說明項目
   ============================================ */
interface FeatureItemProps {
  title: string;
  description: string;
}

function FeatureItem({ title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-card/50 p-3">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
