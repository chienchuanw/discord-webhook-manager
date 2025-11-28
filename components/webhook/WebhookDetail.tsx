"use client";

import * as React from "react";
import {
  Copy,
  Send,
  Settings,
  Trash2,
  RefreshCw,
  Loader2,
  Clock,
  Ban,
  Hash,
  Info,
  X,
} from "lucide-react";

import { faDiscord } from "@fortawesome/free-brands-svg-icons";

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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/* ============================================
   訊息記錄型別定義
   ============================================ */
interface MessageLogItem {
  id: string;
  content: string;
  status: "pending" | "success" | "failed";
  statusCode?: number;
  errorMessage?: string;
  sentAt: string;
  scheduledAt?: string;
  scheduledStatus?: "pending" | "sent" | "cancelled";
}

/**
 * 判斷預約訊息是否已過期
 * 過期條件：scheduledStatus 為 pending 且 scheduledAt 已過去
 */
function isScheduledExpired(log: MessageLogItem): boolean {
  if (log.scheduledStatus !== "pending" || !log.scheduledAt) {
    return false;
  }
  return new Date(log.scheduledAt) < new Date();
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
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = React.useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = React.useState(false);

  // 訊息列表容器的 ref，用於偵測滾動
  const messageListRef = React.useRef<HTMLDivElement>(null);

  // 載入最新的訊息歷史記錄（重置分頁）
  const fetchMessageLogs = React.useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch(
        `/api/webhooks/${webhook.id}/messages?limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        // API 回傳的是最新的在前，需要反轉順序讓最新的在下方
        const reversedMessages = [...(data.messages || [])].reverse();
        setMessageLogs(reversedMessages);
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      }
    } catch (error) {
      console.error("載入訊息歷史失敗:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [webhook.id]);

  // 載入更多舊訊息（infinite scroll）
  const fetchMoreMessages = React.useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/webhooks/${
          webhook.id
        }/messages?limit=20&cursor=${encodeURIComponent(nextCursor)}`
      );
      if (response.ok) {
        const data = await response.json();
        // 舊訊息要插入到列表前面，並反轉順序
        const reversedMessages = [...(data.messages || [])].reverse();
        setMessageLogs((prev) => [...reversedMessages, ...prev]);
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      }
    } catch (error) {
      console.error("載入更多訊息失敗:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [webhook.id, isLoadingMore, hasMore, nextCursor]);

  // 元件載入時取得訊息歷史
  React.useEffect(() => {
    fetchMessageLogs();
  }, [fetchMessageLogs]);

  // 監聽滾動事件，實作 infinite scroll（往上滾動載入舊訊息）
  React.useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    const handleScroll = () => {
      // 當滾動到接近頂部時（距離頂部 100px 內），載入更多
      if (container.scrollTop < 100 && hasMore && !isLoadingMore) {
        // 記錄當前滾動高度，用於載入後維持位置
        const previousScrollHeight = container.scrollHeight;

        fetchMoreMessages().then(() => {
          // 載入完成後，調整滾動位置以維持視覺連續性
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          });
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore, fetchMoreMessages]);

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

  // 訊息列表的 ref，用於自動滾動到底部
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 滾動到訊息列表底部
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 當訊息列表更新時自動滾動到底部
  React.useEffect(() => {
    scrollToBottom();
  }, [messageLogs, scrollToBottom]);

  return (
    <div className="flex h-full flex-col">
      {/* 頂部標題與操作按鈕 - Discord 頻道標題列風格 */}
      <header className="flex flex-col gap-4 border-b border-border bg-[#2b2d31] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          {/* Discord 頻道圖示 */}
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold text-foreground">
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

      {/* 主要內容區 - Discord 聊天室風格，固定在視口高度內 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#313338]">
        {/* 聊天室標題列 */}
        <div className="flex items-center justify-between border-b border-[#3f4147] px-4 py-2">
          <span className="text-sm text-muted-foreground">訊息發送記錄</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMessageLogs}
              disabled={isLoadingLogs}
              className="h-7 gap-1 text-xs"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingLogs ? "animate-spin" : ""}`}
              />
              重新整理
            </Button>
            {/* Webhook 資訊面板切換按鈕 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
                  className={`h-7 w-7 ${
                    isInfoPanelOpen
                      ? "bg-[#3f4147] text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInfoPanelOpen ? "關閉資訊面板" : "Webhook 資訊"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 內容區域：訊息列表 + 可收合的資訊面板 */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* 訊息區域 */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* 訊息列表區域 - Discord 風格 */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto px-4 py-4"
            >
              {isLoadingLogs ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messageLogs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5865f2]/20">
                    <Hash className="h-8 w-8 text-[#5865f2]" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    歡迎來到 #{webhook.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    這是這個 Webhook 頻道的開始，在下方輸入訊息開始發送吧！
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 載入更多指示器 */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        載入更多訊息...
                      </span>
                    </div>
                  )}

                  {/* 沒有更多訊息的提示 */}
                  {!hasMore && messageLogs.length > 0 && (
                    <div className="flex items-center justify-center py-4">
                      <span className="text-xs text-muted-foreground">
                        — 已顯示所有訊息 —
                      </span>
                    </div>
                  )}

                  {messageLogs.map((log) => (
                    <div
                      key={log.id}
                      className="group flex gap-4 rounded px-2 py-1 hover:bg-[#2e3035]"
                    >
                      {/* Bot 頭像 */}
                      <div className="shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-discord-blurple">
                          <FontAwesomeIcon
                            icon={faDiscord}
                            className="h-5 w-5 text-white"
                          />
                        </div>
                      </div>

                      {/* 訊息內容區 */}
                      <div className="min-w-0 flex-1">
                        {/* 使用者名稱 + 時間 + 狀態 */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            Webhook Bot
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.scheduledStatus === "pending" &&
                            log.scheduledAt
                              ? `預約於 ${formatTime(log.scheduledAt)}`
                              : formatTime(log.sentAt)}
                          </span>
                          {/* 狀態標籤 */}
                          {getStatusBadge(log)}
                        </div>

                        {/* 訊息內容 */}
                        <p className="mt-1 whitespace-pre-wrap text-sm wrap-break-word text-foreground/90">
                          {log.content}
                        </p>

                        {/* 錯誤訊息 */}
                        {log.errorMessage && (
                          <p className="mt-1 text-xs text-destructive">
                            {log.errorMessage}
                          </p>
                        )}

                        {/* HTTP 狀態碼 */}
                        {log.statusCode && log.status === "failed" && (
                          <span className="mt-1 inline-block text-xs text-muted-foreground">
                            HTTP {log.statusCode}
                          </span>
                        )}
                      </div>

                      {/* 操作按鈕 - hover 時顯示 */}
                      <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {/* 取消預約按鈕 */}
                        {log.scheduledStatus === "pending" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelSchedule(log.id)}
                                className="h-7 w-7 text-muted-foreground hover:bg-[#3f4147] hover:text-destructive"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>取消預約</TooltipContent>
                          </Tooltip>
                        )}

                        {/* 重新發送按鈕 */}
                        {log.status === "failed" &&
                          log.scheduledStatus !== "pending" &&
                          webhook.isActive && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleResendMessage(log.content)
                                  }
                                  disabled={isSending}
                                  className="h-7 w-7 text-muted-foreground hover:bg-[#3f4147]"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>重新發送</TooltipContent>
                            </Tooltip>
                          )}
                      </div>
                    </div>
                  ))}
                  {/* 用於自動滾動的參考點 */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* 底部訊息輸入區 - Discord 風格 */}
            <div className="shrink-0 border-t border-[#3f4147] bg-[#313338] px-4 py-4">
              {!webhook.isActive ? (
                <div className="flex items-center justify-center rounded-lg bg-[#2b2d31] px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Webhook 已停用，無法發送訊息
                  </p>
                </div>
              ) : (
                <div className="flex items-end gap-2 rounded-lg bg-[#383a40] px-4 py-2">
                  {/* 訊息輸入框 */}
                  <Textarea
                    placeholder={`傳送訊息至 #${webhook.name}`}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      // Ctrl/Cmd + Enter 發送訊息
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-6 max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
                    disabled={isSending}
                    rows={1}
                  />

                  {/* 預約發送按鈕 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScheduleDialogOpen(true)}
                        disabled={!messageContent.trim() || isSending}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-[#4e5058] hover:text-foreground"
                      >
                        <Clock className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>預約發送</TooltipContent>
                  </Tooltip>

                  {/* 發送按鈕 */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || isSending}
                    size="icon"
                    className="h-8 w-8 shrink-0 bg-discord-blurple text-white hover:bg-discord-blurple/80 disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* 快捷鍵提示 */}
              {webhook.isActive && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  按下{" "}
                  <kbd className="rounded bg-[#232428] px-1.5 py-0.5">Ctrl</kbd>{" "}
                  +{" "}
                  <kbd className="rounded bg-[#232428] px-1.5 py-0.5">
                    Enter
                  </kbd>{" "}
                  快速發送
                </p>
              )}
            </div>
          </div>

          {/* 右側可收合資訊面板 */}
          {isInfoPanelOpen && (
            <aside className="w-72 shrink-0 border-l border-[#3f4147] bg-[#2b2d31]">
              <div className="flex items-center justify-between border-b border-[#3f4147] px-4 py-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Webhook 資訊
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsInfoPanelOpen(false)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4 p-4">
                {/* URL 顯示與複製 */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Webhook URL
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-[#1e1f22] px-2 py-1.5 text-xs">
                      {webhook.url || "尚未設定"}
                    </code>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopyUrl}
                          className="h-7 w-7 shrink-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copied ? "已複製！" : "複製 URL"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <Separator className="bg-[#3f4147]" />

                {/* 狀態開關 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">啟用狀態</span>
                  <Switch
                    checked={webhook.isActive}
                    onCheckedChange={onToggleActive}
                  />
                </div>

                {/* 建立時間 */}
                {webhook.createdAt && (
                  <>
                    <Separator className="bg-[#3f4147]" />
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        建立時間
                      </label>
                      <p className="mt-1 text-sm text-foreground">
                        {formatTime(webhook.createdAt)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
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

/**
 * 根據訊息記錄的狀態回傳對應的狀態標籤
 * 用於 Discord 風格的訊息顯示
 */
function getStatusBadge(log: MessageLogItem): React.ReactNode {
  // 過期的預約訊息
  if (isScheduledExpired(log)) {
    return (
      <Badge
        variant="outline"
        className="border-orange-500/50 bg-orange-500/10 text-orange-500"
      >
        已過期
      </Badge>
    );
  }

  // 預約訊息狀態
  if (log.scheduledStatus === "pending") {
    return (
      <Badge
        variant="outline"
        className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
      >
        等待發送
      </Badge>
    );
  }

  if (log.scheduledStatus === "cancelled") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        已取消
      </Badge>
    );
  }

  // 一般訊息狀態
  if (log.status === "success") {
    return (
      <Badge
        variant="outline"
        className="border-discord-green/50 bg-discord-green/10 text-discord-green"
      >
        已發送
      </Badge>
    );
  }

  if (log.status === "failed") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/50 bg-destructive/10 text-destructive"
      >
        發送失敗
      </Badge>
    );
  }

  return null;
}
