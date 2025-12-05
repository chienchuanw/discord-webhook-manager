"use client";

import * as React from "react";
import { Clock, Edit, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
 * 樣板資料結構（對應 API 回傳）
 */
export interface TemplateData {
  id: string;
  name: string;
  description?: string;
  messageContent?: string;
  embedData?: EmbedData;
  imageUrl?: string;
  scheduleType: ScheduleType;
  intervalMinutes?: number;
  scheduleTime?: string;
  scheduleDays?: number[];
  createdAt: string;
  updatedAt: string;
}

interface TemplateCardProps {
  template: TemplateData;
  onEdit: () => void;
  onDelete: () => void;
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
function getScheduleDescription(template: TemplateData): string {
  const { scheduleType, intervalMinutes, scheduleTime, scheduleDays } =
    template;

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

/* ============================================
   TemplateCard 元件
   顯示單一樣板的卡片
   ============================================ */
export function TemplateCard({
  template,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  // 取得 Embed 顏色（轉為 CSS 顏色）
  const embedColor = template.embedData?.color
    ? `#${template.embedData.color.toString(16).padStart(6, "0")}`
    : undefined;

  return (
    <Card className="group relative overflow-hidden border-[#1e1f22] bg-[#2b2d31] transition-all hover:border-[#5865f2]/50">
      {/* Embed 顏色指示條 */}
      {embedColor && (
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: embedColor }}
        />
      )}

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          {/* 樣板名稱 */}
          <h3 className="font-semibold text-white">{template.name}</h3>

          {/* 排程類型標籤 */}
          <Badge variant="secondary" className="bg-[#404249] text-[#b5bac1]">
            <Clock className="mr-1 h-3 w-3" />
            {getScheduleTypeLabel(template.scheduleType)}
          </Badge>
        </div>

        {/* 更多選項選單 */}
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
              onClick={onEdit}
              className="text-[#b5bac1] focus:bg-[#404249] focus:text-white"
            >
              <Edit className="mr-2 h-4 w-4" />
              編輯
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 描述 */}
        {template.description && (
          <p className="line-clamp-2 text-sm text-[#b5bac1]">
            {template.description}
          </p>
        )}

        {/* 排程時間說明 */}
        <div className="flex items-center text-xs text-[#949ba4]">
          <Clock className="mr-1 h-3 w-3" />
          {getScheduleDescription(template)}
        </div>

        {/* 內容預覽 */}
        <div className="rounded bg-[#1e1f22] p-2">
          {/* Embed 預覽 */}
          {template.embedData?.title && (
            <p className="line-clamp-1 text-sm font-medium text-white">
              {template.embedData.title}
            </p>
          )}
          {template.embedData?.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[#b5bac1]">
              {template.embedData.description}
            </p>
          )}
          {/* 純文字預覽 */}
          {!template.embedData && template.messageContent && (
            <p className="line-clamp-2 text-xs text-[#b5bac1]">
              {template.messageContent}
            </p>
          )}
          {/* 圖片指示 */}
          {template.imageUrl && (
            <p className="mt-1 text-xs text-[#5865f2]">📷 含有圖片</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
