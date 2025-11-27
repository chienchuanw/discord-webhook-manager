"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Send,
  Settings,
  Trash2,
  Power,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WebhookItem } from "@/components/layout/WebhookSidebar";

/* ============================================
   WebhookDetail 元件
   顯示選中的 Webhook 詳細資訊
   ============================================ */
interface WebhookDetailProps {
  webhook: WebhookItem & {
    url?: string;
    createdAt?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onTestSend: () => void;
  onToggleActive: (isActive: boolean) => void;
}

export function WebhookDetail({
  webhook,
  onEdit,
  onDelete,
  onTestSend,
  onToggleActive,
}: WebhookDetailProps) {
  const [copied, setCopied] = React.useState(false);

  // 複製 Webhook URL 到剪貼簿
  const handleCopyUrl = async () => {
    if (webhook.url) {
      await navigator.clipboard.writeText(webhook.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 頂部標題與操作按鈕 */}
      <header className="flex flex-col gap-4 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground sm:text-xl">
            {webhook.name}
          </h1>
          <Badge
            variant={webhook.isActive ? "default" : "secondary"}
            className={
              webhook.isActive
                ? "bg-discord-green/20 text-discord-green hover:bg-discord-green/30"
                : ""
            }
          >
            {webhook.isActive ? "啟用" : "停用"}
          </Badge>
        </div>

        {/* 操作按鈕 - Discord 實心背景風格 */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={onTestSend}
            className="flex-1 gap-2 bg-discord-blurple text-white hover:bg-discord-blurple/80 sm:flex-none"
          >
            <Send className="h-4 w-4" />
            <span className="hidden xs:inline">測試發送</span>
            <span className="xs:hidden">測試</span>
          </Button>
          <Button
            size="sm"
            onClick={onEdit}
            className="flex-1 gap-2 bg-[#4e5058] text-white hover:bg-[#6d6f78] sm:flex-none"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden xs:inline">編輯</span>
          </Button>
          <Button
            size="sm"
            onClick={onDelete}
            className="flex-1 gap-2 bg-destructive text-white hover:bg-destructive/80 sm:flex-none"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden xs:inline">刪除</span>
          </Button>
        </div>
      </header>

      {/* 主要內容區 - RWD 調整 padding */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Webhook 資訊卡片 */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="h-4 w-4" />
                Webhook 資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL 顯示與複製 */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Webhook URL
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-input px-3 py-2 text-sm">
                    {webhook.url || "尚未設定"}
                  </code>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyUrl}
                        className="h-9 w-9 shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copied ? "已複製！" : "複製 URL"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Separator />

              {/* 狀態開關 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">啟用狀態</span>
                </div>
                <Switch
                  checked={webhook.isActive}
                  onCheckedChange={onToggleActive}
                />
              </div>
            </CardContent>
          </Card>

          {/* 統計資訊卡片 */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">使用統計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatItem
                  icon={<CheckCircle2 className="h-5 w-5 text-discord-green" />}
                  label="成功發送"
                  value={webhook.successCount}
                  color="text-discord-green"
                />
                <StatItem
                  icon={<XCircle className="h-5 w-5 text-discord-red" />}
                  label="發送失敗"
                  value={webhook.failCount}
                  color="text-discord-red"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* 統計項目子元件 */
function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
