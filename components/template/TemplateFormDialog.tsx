"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmbedPreview } from "./EmbedPreview";
import { ScheduleType, type EmbedData } from "@/types/template";

/* ============================================
   型別定義
   ============================================ */

export interface TemplateFormData {
  name: string;
  description?: string;
  messageContent?: string;
  embedData?: EmbedData;
  imageUrl?: string;
  scheduleType: ScheduleType;
  intervalMinutes?: number;
  scheduleTime?: string;
  scheduleDays?: number[];
}

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  initialData?: TemplateFormData;
  title?: string;
  description?: string;
}

/* ============================================
   星期幾選項
   ============================================ */
const WEEKDAYS = [
  { value: 0, label: "日" },
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
];

/* ============================================
   TemplateFormDialog 元件
   樣板新增/編輯對話框
   ============================================ */
export function TemplateFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title = "新增樣板",
  description = "建立一個可重複使用的訊息樣板",
}: TemplateFormDialogProps) {
  // 基本資訊
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [desc, setDesc] = React.useState(initialData?.description ?? "");

  // 訊息內容
  const [messageContent, setMessageContent] = React.useState(
    initialData?.messageContent ?? ""
  );
  const [imageUrl, setImageUrl] = React.useState(initialData?.imageUrl ?? "");

  // Embed 資料
  const [embedTitle, setEmbedTitle] = React.useState(
    initialData?.embedData?.title ?? ""
  );
  const [embedDescription, setEmbedDescription] = React.useState(
    initialData?.embedData?.description ?? ""
  );
  const [embedColor, setEmbedColor] = React.useState(
    initialData?.embedData?.color
      ? `#${initialData.embedData.color.toString(16).padStart(6, "0")}`
      : "#5865f2"
  );

  // 排程設定
  const [scheduleType, setScheduleType] = React.useState<ScheduleType>(
    initialData?.scheduleType ?? ScheduleType.DAILY
  );
  const [intervalMinutes, setIntervalMinutes] = React.useState(
    initialData?.intervalMinutes ?? 60
  );
  const [scheduleTime, setScheduleTime] = React.useState(
    initialData?.scheduleTime ?? "09:00"
  );
  const [scheduleDays, setScheduleDays] = React.useState<number[]>(
    initialData?.scheduleDays ?? [1, 2, 3, 4, 5]
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 重設表單
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setDesc(initialData?.description ?? "");
      setMessageContent(initialData?.messageContent ?? "");
      setImageUrl(initialData?.imageUrl ?? "");
      setEmbedTitle(initialData?.embedData?.title ?? "");
      setEmbedDescription(initialData?.embedData?.description ?? "");
      setEmbedColor(
        initialData?.embedData?.color
          ? `#${initialData.embedData.color.toString(16).padStart(6, "0")}`
          : "#5865f2"
      );
      setScheduleType(initialData?.scheduleType ?? ScheduleType.DAILY);
      setIntervalMinutes(initialData?.intervalMinutes ?? 60);
      setScheduleTime(initialData?.scheduleTime ?? "09:00");
      setScheduleDays(initialData?.scheduleDays ?? [1, 2, 3, 4, 5]);
    }
  }, [open, initialData]);

  // 建構 Embed 資料
  const buildEmbedData = (): EmbedData | undefined => {
    if (!embedTitle && !embedDescription) return undefined;

    return {
      title: embedTitle || undefined,
      description: embedDescription || undefined,
      color: parseInt(embedColor.slice(1), 16),
    };
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData: TemplateFormData = {
        name,
        description: desc || undefined,
        messageContent: messageContent || undefined,
        embedData: buildEmbedData(),
        imageUrl: imageUrl || undefined,
        scheduleType,
        intervalMinutes:
          scheduleType === ScheduleType.INTERVAL ? intervalMinutes : undefined,
        scheduleTime:
          scheduleType !== ScheduleType.INTERVAL ? scheduleTime : undefined,
        scheduleDays:
          scheduleType === ScheduleType.WEEKLY ? scheduleDays : undefined,
      };

      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("提交失敗:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 切換星期幾
  const toggleDay = (day: number) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl border-[#1e1f22] bg-[#313338] p-0 text-white">
        <DialogHeader className="border-b border-[#1e1f22] p-4">
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-[#b5bac1]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex max-h-[60vh]">
            {/* 左側：表單 */}
            <ScrollArea className="flex-1 border-r border-[#1e1f22]">
              <div className="space-y-4 p-4">
                {/* 基本資訊區 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#b5bac1]">
                    基本資訊
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#b5bac1]">
                      樣板名稱 *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例如：每日公告"
                      required
                      className="border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#6d6f78]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc" className="text-[#b5bac1]">
                      描述
                    </Label>
                    <Input
                      id="desc"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="樣板的簡短說明"
                      className="border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#6d6f78]"
                    />
                  </div>
                </div>

                <Separator className="bg-[#1e1f22]" />

                {/* 訊息內容區 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#b5bac1]">
                    訊息內容
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-[#b5bac1]">
                      純文字訊息
                    </Label>
                    <Textarea
                      id="content"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="在 Embed 之前顯示的純文字"
                      rows={3}
                      className="border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#6d6f78]"
                    />
                  </div>
                </div>

                <Separator className="bg-[#1e1f22]" />

                {/* Embed 設定區 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#b5bac1]">
                    Embed 設定
                  </h3>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="embedTitle" className="text-[#b5bac1]">
                        標題
                      </Label>
                      <Input
                        id="embedTitle"
                        value={embedTitle}
                        onChange={(e) => setEmbedTitle(e.target.value)}
                        placeholder="Embed 標題"
                        className="border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#6d6f78]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="embedDesc" className="text-[#b5bac1]">
                        內容
                      </Label>
                      <Textarea
                        id="embedDesc"
                        value={embedDescription}
                        onChange={(e) => setEmbedDescription(e.target.value)}
                        placeholder="Embed 內容"
                        rows={4}
                        className="border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#6d6f78]"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="embedColor" className="text-[#b5bac1]">
                        顏色
                      </Label>
                      <Input
                        id="embedColor"
                        type="color"
                        value={embedColor}
                        onChange={(e) => setEmbedColor(e.target.value)}
                        className="h-8 w-16 cursor-pointer border-[#1e1f22] bg-[#1e1f22] p-0"
                      />
                      <span className="text-sm text-[#949ba4]">
                        {embedColor}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-[#b5bac1]">
                        圖片 URL
                      </Label>
                      <Input
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#6d6f78]"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#1e1f22]" />

                {/* 排程設定區 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#b5bac1]">
                    排程設定
                  </h3>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label className="text-[#b5bac1]">排程類型</Label>
                      <Select
                        value={scheduleType}
                        onValueChange={(v) =>
                          setScheduleType(v as ScheduleType)
                        }
                      >
                        <SelectTrigger className="border-[#1e1f22] bg-[#1e1f22] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-[#1e1f22] bg-[#2b2d31]">
                          <SelectItem value={ScheduleType.INTERVAL}>
                            固定間隔
                          </SelectItem>
                          <SelectItem value={ScheduleType.DAILY}>
                            每天
                          </SelectItem>
                          <SelectItem value={ScheduleType.WEEKLY}>
                            每週
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 間隔設定 */}
                    {scheduleType === ScheduleType.INTERVAL && (
                      <div className="space-y-2">
                        <Label className="text-[#b5bac1]">間隔分鐘</Label>
                        <Input
                          type="number"
                          min={1}
                          value={intervalMinutes}
                          onChange={(e) =>
                            setIntervalMinutes(Number(e.target.value))
                          }
                          className="border-[#1e1f22] bg-[#1e1f22] text-white"
                        />
                      </div>
                    )}

                    {/* 時間設定 */}
                    {scheduleType !== ScheduleType.INTERVAL && (
                      <div className="space-y-2">
                        <Label className="text-[#b5bac1]">發送時間</Label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="border-[#1e1f22] bg-[#1e1f22] text-white"
                        />
                      </div>
                    )}

                    {/* 星期幾設定 */}
                    {scheduleType === ScheduleType.WEEKLY && (
                      <div className="space-y-2">
                        <Label className="text-[#b5bac1]">發送日期</Label>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map((day) => (
                            <Button
                              key={day.value}
                              type="button"
                              size="sm"
                              variant={
                                scheduleDays.includes(day.value)
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => toggleDay(day.value)}
                              className={
                                scheduleDays.includes(day.value)
                                  ? "bg-[#5865f2] hover:bg-[#4752c4]"
                                  : "border-[#1e1f22] bg-transparent text-[#b5bac1]"
                              }
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* 右側：預覽 */}
            <div className="w-80 shrink-0 p-4">
              <h3 className="mb-3 text-sm font-medium text-[#b5bac1]">
                即時預覽
              </h3>
              <EmbedPreview
                messageContent={messageContent}
                embedData={buildEmbedData()}
                imageUrl={imageUrl}
              />
            </div>
          </div>

          {/* 底部按鈕 */}
          <DialogFooter className="border-t border-[#1e1f22] p-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-[#4e5058]"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name}
              className="bg-[#5865f2] text-white hover:bg-[#4752c4]"
            >
              {isSubmitting ? "處理中..." : initialData ? "儲存" : "建立"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
