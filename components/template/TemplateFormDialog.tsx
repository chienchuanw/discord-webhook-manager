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
      {/* Discord 風格：加寬 Dialog、圓角、陰影 */}
      {/* 注意：使用 sm:max-w-6xl 覆蓋 ui/dialog.tsx 中的 sm:max-w-lg 基礎樣式 */}
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden rounded-lg border-none bg-[#313338] p-0 text-white shadow-2xl sm:max-w-6xl">
        {/* Header 區塊 - Discord 風格的簡潔標題 */}
        <DialogHeader className="bg-[#2b2d31] px-6 py-4">
          <DialogTitle className="text-xl font-semibold text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#949ba4]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex max-h-[70vh]">
            {/* 左側：表單區 - 增加間距與更好的視覺層次 */}
            <ScrollArea className="flex-1">
              <div className="space-y-6 p-6">
                {/* 基本資訊區 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
                      基本資訊
                    </h3>
                  </div>
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm text-[#b5bac1]">
                        樣板名稱 <span className="text-[#ed4245]">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例如：每日公告"
                        required
                        className="h-11 rounded-lg border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc" className="text-sm text-[#b5bac1]">
                        描述
                      </Label>
                      <Input
                        id="desc"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="樣板的簡短說明"
                        className="h-11 rounded-lg border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                      />
                    </div>
                  </div>
                </div>

                {/* 訊息內容區 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
                      訊息內容
                    </h3>
                  </div>
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="content"
                        className="text-sm text-[#b5bac1]"
                      >
                        純文字訊息
                      </Label>
                      <Textarea
                        id="content"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="在 Embed 之前顯示的純文字"
                        rows={3}
                        className="resize-none rounded-lg border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                      />
                    </div>
                  </div>
                </div>

                {/* Embed 設定區 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
                      Embed 設定
                    </h3>
                  </div>
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="embedTitle"
                          className="text-sm text-[#b5bac1]"
                        >
                          標題
                        </Label>
                        <Input
                          id="embedTitle"
                          value={embedTitle}
                          onChange={(e) => setEmbedTitle(e.target.value)}
                          placeholder="Embed 標題"
                          className="h-11 rounded-lg border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="embedColor"
                          className="text-sm text-[#b5bac1]"
                        >
                          側邊顏色
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="embedColor"
                            type="color"
                            value={embedColor}
                            onChange={(e) => setEmbedColor(e.target.value)}
                            className="h-11 w-14 cursor-pointer rounded-lg border-none bg-[#1e1f22] p-1"
                          />
                          <span className="font-mono text-sm text-[#949ba4]">
                            {embedColor.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="embedDesc"
                        className="text-sm text-[#b5bac1]"
                      >
                        內容
                      </Label>
                      <Textarea
                        id="embedDesc"
                        value={embedDescription}
                        onChange={(e) => setEmbedDescription(e.target.value)}
                        placeholder="Embed 內容（支援 Markdown）"
                        rows={4}
                        className="resize-none rounded-lg border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="imageUrl"
                        className="text-sm text-[#b5bac1]"
                      >
                        圖片 URL
                      </Label>
                      <Input
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="h-11 rounded-lg border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                      />
                    </div>
                  </div>
                </div>

                {/* 排程設定區 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
                      排程設定
                    </h3>
                  </div>
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-[#b5bac1]">排程類型</Label>
                      <Select
                        value={scheduleType}
                        onValueChange={(v) =>
                          setScheduleType(v as ScheduleType)
                        }
                      >
                        <SelectTrigger className="h-11 rounded-lg border-none bg-[#1e1f22] text-white focus:ring-1 focus:ring-[#5865f2]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-none bg-[#1e1f22] text-white">
                          <SelectItem
                            value={ScheduleType.INTERVAL}
                            className="focus:bg-[#5865f2]/20"
                          >
                            固定間隔
                          </SelectItem>
                          <SelectItem
                            value={ScheduleType.DAILY}
                            className="focus:bg-[#5865f2]/20"
                          >
                            每天
                          </SelectItem>
                          <SelectItem
                            value={ScheduleType.WEEKLY}
                            className="focus:bg-[#5865f2]/20"
                          >
                            每週
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 間隔設定 */}
                    {scheduleType === ScheduleType.INTERVAL && (
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">
                          間隔分鐘
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={intervalMinutes}
                          onChange={(e) =>
                            setIntervalMinutes(Number(e.target.value))
                          }
                          className="h-11 rounded-lg border-none bg-[#1e1f22] text-white focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                    )}

                    {/* 時間設定 */}
                    {scheduleType !== ScheduleType.INTERVAL && (
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">
                          發送時間
                        </Label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="h-11 rounded-lg border-none bg-[#1e1f22] text-white focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                    )}

                    {/* 星期幾設定 */}
                    {scheduleType === ScheduleType.WEEKLY && (
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">
                          發送日期
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map((day) => (
                            <Button
                              key={day.value}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => toggleDay(day.value)}
                              className={
                                scheduleDays.includes(day.value)
                                  ? "h-9 w-9 rounded-full border-none bg-[#5865f2] text-white hover:bg-[#4752c4]"
                                  : "h-9 w-9 rounded-full border-none bg-[#1e1f22] text-[#b5bac1] hover:bg-[#3f4147] hover:text-white"
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

            {/* 右側：預覽區 - Discord 風格的深色背景 */}
            <div className="w-[420px] shrink-0 border-l border-[#1e1f22] bg-[#2b2d31]">
              <div className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
                    即時預覽
                  </h3>
                </div>
                <div className="rounded-lg bg-[#313338] p-4">
                  <EmbedPreview
                    messageContent={messageContent}
                    embedData={buildEmbedData()}
                    imageUrl={imageUrl}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 底部按鈕 - Discord 風格的深色背景 */}
          <DialogFooter className="flex justify-end gap-3 bg-[#2b2d31] px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 text-sm text-white hover:bg-transparent hover:underline"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name}
              className="h-10 rounded-lg bg-[#5865f2] px-6 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "處理中..."
                : initialData
                ? "儲存變更"
                : "建立樣板"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
