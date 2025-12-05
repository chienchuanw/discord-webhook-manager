"use client";

import * as React from "react";
import {
  Clock,
  Edit,
  MoreVertical,
  Trash2,
  Play,
  Pause,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScheduleType, type EmbedData } from "@/types/template";

/* ============================================
   型別定義
   ============================================ */

/**
 * WebhookSchedule 資料結構（對應 API 回傳）
 */
export interface WebhookScheduleData {
  id: string;
  name: string;
  messageContent?: string;
  embedData?: EmbedData;
  imageUrl?: string;
  scheduleType: ScheduleType;
  intervalMinutes?: number;
  scheduleTime?: string;
  scheduleDays?: number[];
  isActive: boolean;
  lastTriggeredAt?: string;
  nextTriggerAt?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WebhookScheduleCardProps {
  schedule: WebhookScheduleData;
  onEdit: (schedule: WebhookScheduleData) => void;
  onDelete: (schedule: WebhookScheduleData) => void;
  onToggleActive: (schedule: WebhookScheduleData) => void;
}

/* ============================================
   工具函式
   ============================================ */

/**
 * 根據排程類型取得顯示文字
 */
function getScheduleTypeLabel(type: ScheduleType): string {
  switch (type) {
    case ScheduleType.INTERVAL:
      return "間隔";
    case ScheduleType.DAILY:
      return "每日";
    case ScheduleType.WEEKLY:
      return "每週";
    default:
      return type;
  }
}

/**
 * 取得排程時間的顯示文字
 */
function getScheduleDescription(schedule: WebhookScheduleData): string {
  const { scheduleType, intervalMinutes, scheduleTime, scheduleDays } =
    schedule;

  switch (scheduleType) {
    case ScheduleType.INTERVAL:
      return `每 ${intervalMinutes || 60} 分鐘`;
    case ScheduleType.DAILY:
      return `每天 ${scheduleTime || "09:00"}`;
    case ScheduleType.WEEKLY: {
      const days = scheduleDays || [];
      const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
      const dayLabels = days.map((d) => `週${dayNames[d]}`).join("、");
      return `${dayLabels} ${scheduleTime || "09:00"}`;
    }
    default:
      return "";
  }
}

/**
 * 格式化時間顯示
 */
function formatDateTime(dateString?: string): string {
  if (!dateString) return "尚未觸發";
  const date = new Date(dateString);
  return date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ============================================
   WebhookScheduleCard 元件
   顯示單一排程的卡片
   ============================================ */
export function WebhookScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onToggleActive,
}: WebhookScheduleCardProps) {
  // 取得 Embed 顏色
  const embedColor = schedule.embedData?.color
    ? `#${schedule.embedData.color.toString(16).padStart(6, "0")}`
    : undefined;

  return (
    <Card
      className={`group relative overflow-hidden border-[#1e1f22] bg-[#2b2d31] transition-all hover:border-[#5865f2]/50 ${
        !schedule.isActive ? "opacity-60" : ""
      }`}
    >
      {/* Embed 顏色指示條 */}
      {embedColor && (
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: embedColor }}
        />
      )}

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          {/* 排程名稱 */}
          <h3 className="font-semibold text-white">{schedule.name}</h3>

          {/* 狀態與類型標籤 */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={
                schedule.isActive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-[#404249] text-[#949ba4]"
              }
            >
              {schedule.isActive ? (
                <>
                  <Play className="mr-1 h-3 w-3" />
                  啟用
                </>
              ) : (
                <>
                  <Pause className="mr-1 h-3 w-3" />
                  停用
                </>
              )}
            </Badge>
            <Badge variant="secondary" className="bg-[#404249] text-[#b5bac1]">
              <Clock className="mr-1 h-3 w-3" />
              {getScheduleTypeLabel(schedule.scheduleType)}
            </Badge>
          </div>
        </div>
        {/* 更多選項選單 */}
        <div className="flex items-center gap-2">
          {/* 啟用開關 */}
          <Switch
            checked={schedule.isActive}
            onCheckedChange={() => onToggleActive(schedule)}
            className="data-[state=checked]:bg-[#5865f2]"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-[#1e1f22] bg-[#2b2d31]"
            >
              <DropdownMenuItem
                onClick={() => onEdit(schedule)}
                className="text-[#b5bac1] focus:bg-[#404249] focus:text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                編輯
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(schedule)}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 排程時間說明 */}
        <div className="flex items-center text-sm text-[#b5bac1]">
          <Clock className="mr-2 h-4 w-4" />
          {getScheduleDescription(schedule)}
        </div>

        {/* 下次觸發時間 */}
        {schedule.nextTriggerAt && schedule.isActive && (
          <div className="flex items-center text-xs text-[#949ba4]">
            <Calendar className="mr-2 h-3 w-3" />
            下次觸發: {formatDateTime(schedule.nextTriggerAt)}
          </div>
        )}

        {/* 內容預覽 */}
        <div className="rounded bg-[#1e1f22] p-2">
          {schedule.embedData?.title && (
            <p className="line-clamp-1 text-sm font-medium text-white">
              {schedule.embedData.title}
            </p>
          )}
          {schedule.embedData?.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[#b5bac1]">
              {schedule.embedData.description}
            </p>
          )}
          {!schedule.embedData && schedule.messageContent && (
            <p className="line-clamp-2 text-xs text-[#b5bac1]">
              {schedule.messageContent}
            </p>
          )}
          {schedule.imageUrl && (
            <p className="mt-1 text-xs text-[#5865f2]">📷 含有圖片</p>
          )}
        </div>

        {/* 統計資訊 */}
        <div className="flex items-center gap-4 text-xs text-[#949ba4]">
          <span className="text-green-400">✓ 成功 {schedule.successCount}</span>
          {schedule.failureCount > 0 && (
            <span className="text-red-400">✗ 失敗 {schedule.failureCount}</span>
          )}
          {schedule.lastTriggeredAt && (
            <span>上次: {formatDateTime(schedule.lastTriggeredAt)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
