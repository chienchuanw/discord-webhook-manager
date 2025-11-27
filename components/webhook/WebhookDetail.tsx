"use client";

import * as React from "react";
import {
  Copy,
  Send,
  Settings,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Ban,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WebhookItem } from "@/components/layout/WebhookSidebar";
import { ScheduleDialog } from "@/components/webhook/ScheduleDialog";

/* ============================================
   訊息記錄型別定義
   ============================================ */
interface MessageLogItem {
  id: string;
  content: string;
  status: "success" | "failed";
  statusCode?: number;
  errorMessage?: string;
  sentAt: string;
  scheduledAt?: string;
  scheduledStatus?: "pending" | "sent" | "cancelled";
}

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
  const [messageContent, setMessageContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [messageLogs, setMessageLogs] = React.useState<MessageLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = React.useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = React.useState(false);

  // 載入訊息歷史記錄
  const fetchMessageLogs = React.useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessageLogs(data.messages || []);
      }
    } catch (error) {
      console.error("載入訊息歷史失敗:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [webhook.id]);

  // 元件載入時取得訊息歷史
  React.useEffect(() => {
    fetchMessageLogs();
  }, [fetchMessageLogs]);

  // 發送訊息
  const handleSendMessage = async () => {
    if (!messageContent.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // 清空輸入框並重新載入歷史記錄
        setMessageContent("");
        await fetchMessageLogs();
      } else {
        console.error("發送失敗:", data.error);
      }
    } catch (error) {
      console.error("發送訊息失敗:", error);
    } finally {
      setIsSending(false);
    }
  };

  // 重新發送失敗的訊息
  const handleResendMessage = async (content: string) => {
    setMessageContent(content);
    // 自動觸發發送
    setIsSending(true);
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        await fetchMessageLogs();
      }
    } catch (error) {
      console.error("重新發送失敗:", error);
    } finally {
      setIsSending(false);
      setMessageContent("");
    }
  };

  // 格式化時間顯示
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 取消預約訊息
  const handleCancelSchedule = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/cancel`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMessageLogs();
      }
    } catch (error) {
      console.error("取消預約失敗:", error);
    }
  };

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
                  <span className="text-sm">啟用狀態</span>
                </div>
                <Switch
                  checked={webhook.isActive}
                  onCheckedChange={onToggleActive}
                />
              </div>
            </CardContent>
          </Card>

          {/* 發送訊息區塊 */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                發送訊息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="輸入要發送的訊息內容..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={!webhook.isActive || isSending}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    !messageContent.trim() || !webhook.isActive || isSending
                  }
                  className="flex-1 gap-2 bg-discord-blurple text-white hover:bg-discord-blurple/80"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      發送中...
                    </>
                  ) : (
                    <>發送訊息</>
                  )}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      onClick={() => setScheduleDialogOpen(true)}
                      disabled={
                        !messageContent.trim() || !webhook.isActive || isSending
                      }
                      className="shrink-0 bg-discord-blurple text-white hover:bg-discord-blurple/80"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>預約發送</TooltipContent>
                </Tooltip>
              </div>
              {!webhook.isActive && (
                <p className="text-center text-sm text-muted-foreground">
                  Webhook 已停用，無法發送訊息
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 訊息歷史記錄 */}
        <Card className="mt-4 border-border bg-card sm:mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>訊息發送記錄</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMessageLogs}
                disabled={isLoadingLogs}
                className="h-8 gap-1"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingLogs ? "animate-spin" : ""}`}
                />
                重新整理
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messageLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                尚無訊息發送記錄
              </p>
            ) : (
              <div className="space-y-3">
                {messageLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-input/50 p-3"
                  >
                    {/* 狀態圖示 */}
                    <div className="mt-0.5 shrink-0">
                      {log.scheduledStatus === "pending" ? (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      ) : log.scheduledStatus === "cancelled" ? (
                        <Ban className="h-5 w-5 text-muted-foreground" />
                      ) : log.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-discord-green" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>

                    {/* 訊息內容 */}
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm">{log.content}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {/* 預約狀態標記 */}
                        {log.scheduledStatus === "pending" &&
                          log.scheduledAt && (
                            <Badge
                              variant="outline"
                              className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
                            >
                              預約 {formatTime(log.scheduledAt)}
                            </Badge>
                          )}
                        {log.scheduledStatus === "sent" && (
                          <Badge
                            variant="outline"
                            className="border-discord-green/50 bg-discord-green/10 text-discord-green"
                          >
                            預約已發送
                          </Badge>
                        )}
                        {log.scheduledStatus === "cancelled" && (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            已取消
                          </Badge>
                        )}
                        {/* 發送時間 */}
                        {log.scheduledStatus !== "pending" && (
                          <span>{formatTime(log.sentAt)}</span>
                        )}
                        {log.statusCode && (
                          <Badge variant="outline" className="text-xs">
                            HTTP {log.statusCode}
                          </Badge>
                        )}
                        {log.errorMessage && (
                          <span className="text-destructive">
                            {log.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 取消預約按鈕（僅等待中的預約訊息顯示） */}
                    {log.scheduledStatus === "pending" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelSchedule(log.id)}
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>取消預約</TooltipContent>
                      </Tooltip>
                    )}

                    {/* 重新發送按鈕（僅失敗時顯示） */}
                    {log.status === "failed" &&
                      log.scheduledStatus !== "pending" &&
                      webhook.isActive && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResendMessage(log.content)}
                              disabled={isSending}
                              className="h-8 w-8 shrink-0"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>重新發送</TooltipContent>
                        </Tooltip>
                      )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 預約發送對話框 */}
      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        messageContent={messageContent}
        webhookId={webhook.id}
        onScheduled={() => {
          setMessageContent("");
          fetchMessageLogs();
        }}
      />
    </div>
  );
}
