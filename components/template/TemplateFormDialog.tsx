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

  // Embed 基本資料
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
  const [embedUrl, setEmbedUrl] = React.useState(
    initialData?.embedData?.url ?? ""
  );

  // Embed Author 資料
  const [authorName, setAuthorName] = React.useState(
    initialData?.embedData?.author?.name ?? ""
  );
  const [authorUrl, setAuthorUrl] = React.useState(
    initialData?.embedData?.author?.url ?? ""
  );
  const [authorIconUrl, setAuthorIconUrl] = React.useState(
    initialData?.embedData?.author?.icon_url ?? ""
  );

  // Embed Thumbnail 資料
  const [thumbnailUrl, setThumbnailUrl] = React.useState(
    initialData?.embedData?.thumbnail?.url ?? ""
  );

  // Embed Footer 資料
  const [footerText, setFooterText] = React.useState(
    initialData?.embedData?.footer?.text ?? ""
  );
  const [footerIconUrl, setFooterIconUrl] = React.useState(
    initialData?.embedData?.footer?.icon_url ?? ""
  );

  // Embed Timestamp
  const [embedTimestamp, setEmbedTimestamp] = React.useState(
    initialData?.embedData?.timestamp ?? ""
  );

  // Embed Fields（可動態新增/刪除）
  const [embedFields, setEmbedFields] = React.useState<
    Array<{ name: string; value: string; inline: boolean }>
  >(
    initialData?.embedData?.fields?.map((f) => ({
      name: f.name,
      value: f.value,
      inline: f.inline ?? false,
    })) ?? []
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
      // Embed 基本資料
      setEmbedTitle(initialData?.embedData?.title ?? "");
      setEmbedDescription(initialData?.embedData?.description ?? "");
      setEmbedColor(
        initialData?.embedData?.color
          ? `#${initialData.embedData.color.toString(16).padStart(6, "0")}`
          : "#5865f2"
      );
      setEmbedUrl(initialData?.embedData?.url ?? "");
      // Embed Author
      setAuthorName(initialData?.embedData?.author?.name ?? "");
      setAuthorUrl(initialData?.embedData?.author?.url ?? "");
      setAuthorIconUrl(initialData?.embedData?.author?.icon_url ?? "");
      // Embed Thumbnail
      setThumbnailUrl(initialData?.embedData?.thumbnail?.url ?? "");
      // Embed Footer
      setFooterText(initialData?.embedData?.footer?.text ?? "");
      setFooterIconUrl(initialData?.embedData?.footer?.icon_url ?? "");
      // Embed Timestamp
      setEmbedTimestamp(initialData?.embedData?.timestamp ?? "");
      // Embed Fields
      setEmbedFields(
        initialData?.embedData?.fields?.map((f) => ({
          name: f.name,
          value: f.value,
          inline: f.inline ?? false,
        })) ?? []
      );
      // 排程設定
      setScheduleType(initialData?.scheduleType ?? ScheduleType.DAILY);
      setIntervalMinutes(initialData?.intervalMinutes ?? 60);
      setScheduleTime(initialData?.scheduleTime ?? "09:00");
      setScheduleDays(initialData?.scheduleDays ?? [1, 2, 3, 4, 5]);
    }
  }, [open, initialData]);

  // 建構 Embed 資料（整合所有欄位）
  const buildEmbedData = (): EmbedData | undefined => {
    // 判斷是否有任何 Embed 內容
    const hasContent =
      embedTitle ||
      embedDescription ||
      authorName ||
      footerText ||
      thumbnailUrl ||
      imageUrl ||
      embedFields.length > 0;

    if (!hasContent) return undefined;

    return {
      title: embedTitle || undefined,
      description: embedDescription || undefined,
      url: embedUrl || undefined,
      color: parseInt(embedColor.slice(1), 16),
      timestamp: embedTimestamp || undefined,
      author: authorName
        ? {
            name: authorName,
            url: authorUrl || undefined,
            icon_url: authorIconUrl || undefined,
          }
        : undefined,
      thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined,
      image: imageUrl ? { url: imageUrl } : undefined,
      footer: footerText
        ? {
            text: footerText,
            icon_url: footerIconUrl || undefined,
          }
        : undefined,
      fields:
        embedFields.length > 0
          ? embedFields.map((f) => ({
              name: f.name,
              value: f.value,
              inline: f.inline || undefined,
            }))
          : undefined,
    };
  };

  // Fields 操作函數
  const addField = () => {
    setEmbedFields([...embedFields, { name: "", value: "", inline: false }]);
  };

  const updateField = (
    index: number,
    field: Partial<{ name: string; value: string; inline: boolean }>
  ) => {
    setEmbedFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...field } : f))
    );
  };

  const removeField = (index: number) => {
    setEmbedFields((prev) => prev.filter((_, i) => i !== index));
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
                    <h3 className="text-xs font-bold tracking-wide text-[#b5bac1]">
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
                    <h3 className="text-xs font-bold tracking-wide text-[#b5bac1]">
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
                    <h3 className="text-xs font-bold tracking-wide text-[#b5bac1]">
                      Embed 設定
                    </h3>
                  </div>

                  {/* 基本設定 */}
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <p className="text-xs font-medium tracking-wide text-[#949ba4]">
                      基本設定
                    </p>
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
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="embedUrl"
                          className="text-sm text-[#b5bac1]"
                        >
                          標題連結
                        </Label>
                        <Input
                          id="embedUrl"
                          value={embedUrl}
                          onChange={(e) => setEmbedUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
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
                        rows={3}
                        className="resize-none rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="embedColor"
                          className="text-sm text-[#b5bac1]"
                        >
                          側邊顏色
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="embedColor"
                            type="color"
                            value={embedColor}
                            onChange={(e) => setEmbedColor(e.target.value)}
                            className="h-10 w-12 cursor-pointer rounded border-none bg-[#1e1f22] p-1"
                          />
                          <span className="font-mono text-xs text-[#949ba4]">
                            {embedColor.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Author 設定 */}
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <p className="text-xs font-medium tracking-wide text-[#949ba4]">
                      Author
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">名稱</Label>
                        <Input
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          placeholder="Author 名稱"
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">連結</Label>
                        <Input
                          value={authorUrl}
                          onChange={(e) => setAuthorUrl(e.target.value)}
                          placeholder="https://..."
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">圖示</Label>
                        <Input
                          value={authorIconUrl}
                          onChange={(e) => setAuthorIconUrl(e.target.value)}
                          placeholder="圖示 URL"
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 圖片設定 */}
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <p className="text-xs font-medium tracking-wide text-[#949ba4]">
                      圖片
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">
                          主圖片 URL
                        </Label>
                        <Input
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.png"
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">
                          縮圖 URL
                        </Label>
                        <Input
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          placeholder="https://example.com/thumb.png"
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer 設定 */}
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <p className="text-xs font-medium tracking-wide text-[#949ba4]">
                      Footer
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm text-[#b5bac1]">文字</Label>
                        <Input
                          value={footerText}
                          onChange={(e) => setFooterText(e.target.value)}
                          placeholder="Footer 文字"
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-[#b5bac1]">圖示</Label>
                        <Input
                          value={footerIconUrl}
                          onChange={(e) => setFooterIconUrl(e.target.value)}
                          placeholder="圖示 URL"
                          className="h-10 rounded border-none bg-[#1e1f22] text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-[#b5bac1]">時間戳記</Label>
                      <Input
                        type="datetime-local"
                        value={embedTimestamp}
                        onChange={(e) => setEmbedTimestamp(e.target.value)}
                        className="h-10 w-auto rounded border-none bg-[#1e1f22] text-white focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                      />
                    </div>
                  </div>

                  {/* Fields 設定 */}
                  <div className="space-y-4 rounded-lg bg-[#2b2d31] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium tracking-wide text-[#949ba4]">
                        Fields
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addField}
                        className="h-8 border-[#5865f2] bg-transparent text-[#5865f2] hover:bg-[#5865f2]/10"
                      >
                        + 新增 Field
                      </Button>
                    </div>
                    {embedFields.length === 0 ? (
                      <p className="text-center text-sm text-[#6d6f78]">
                        尚未新增任何 Field
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {embedFields.map((field, index) => (
                          <div key={index} className="rounded bg-[#1e1f22] p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs text-[#949ba4]">
                                Field {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeField(index)}
                                className="h-6 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              >
                                刪除
                              </Button>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <Input
                                value={field.name}
                                onChange={(e) =>
                                  updateField(index, { name: e.target.value })
                                }
                                placeholder="Field 名稱"
                                className="h-9 rounded border-none bg-[#2b2d31] text-sm text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                              />
                              <Input
                                value={field.value}
                                onChange={(e) =>
                                  updateField(index, { value: e.target.value })
                                }
                                placeholder="Field 值"
                                className="h-9 rounded border-none bg-[#2b2d31] text-sm text-white placeholder:text-[#6d6f78] focus-visible:ring-1 focus-visible:ring-[#5865f2]"
                              />
                            </div>
                            <label className="mt-2 flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={field.inline}
                                onChange={(e) =>
                                  updateField(index, {
                                    inline: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded border-[#5865f2] bg-[#2b2d31] text-[#5865f2]"
                              />
                              <span className="text-xs text-[#b5bac1]">
                                Inline
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 排程設定區 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold tracking-wide text-[#b5bac1]">
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
                  <h3 className="text-xs font-bold tracking-wide text-[#b5bac1]">
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
              className="text-sm font-medium text-white hover:underline"
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
