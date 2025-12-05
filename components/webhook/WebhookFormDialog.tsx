"use client";

import * as React from "react";
import { Check, ChevronDown, FileText } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

/* ============================================
   型別定義
   ============================================ */

/** 樣板資料（從 API 取得） */
interface TemplateData {
  id: string;
  name: string;
  description?: string;
  scheduleType: "INTERVAL" | "DAILY" | "WEEKLY";
  embedData?: { color?: number };
}

/**
 * Webhook 表單資料型別
 */
export interface WebhookFormData {
  name: string;
  url: string;
  isActive: boolean;
  /** 選擇要套用的樣板 ID（僅新增時有效） */
  templateId?: string;
}

/**
 * WebhookFormDialog 元件屬性
 */
interface WebhookFormDialogProps {
  /** 對話框是否開啟 */
  open: boolean;
  /** 關閉對話框的回呼函式 */
  onOpenChange: (open: boolean) => void;
  /** 表單提交的回呼函式 */
  onSubmit: (data: WebhookFormData) => Promise<void>;
  /** 編輯模式時的初始資料 */
  initialData?: WebhookFormData;
  /** 對話框標題 */
  title?: string;
  /** 對話框描述 */
  description?: string;
}

/* ============================================
   輔助函式：取得排程類型標籤
   ============================================ */
function getScheduleTypeLabel(type: string): string {
  switch (type) {
    case "INTERVAL":
      return "間隔發送";
    case "DAILY":
      return "每日發送";
    case "WEEKLY":
      return "每週發送";
    default:
      return type;
  }
}

/**
 * Webhook 表單對話框元件
 * 用於新增或編輯 Webhook
 * 新增時可選擇套用樣板
 */
export function WebhookFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title = "新增 Webhook",
  description = "輸入 Webhook 的名稱和 Discord Webhook URL",
}: WebhookFormDialogProps) {
  // 判斷是否為新增模式（非編輯模式）
  const isCreateMode = !initialData;

  // 表單狀態
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [url, setUrl] = React.useState(initialData?.url ?? "");
  const [isActive, setIsActive] = React.useState(initialData?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 樣板選擇狀態（僅新增模式使用）
  const [templates, setTemplates] = React.useState<TemplateData[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    string | null
  >(null);
  const [isTemplateOpen, setIsTemplateOpen] = React.useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = React.useState(false);

  // 載入樣板列表
  const fetchTemplates = React.useCallback(async () => {
    if (!isCreateMode) return;
    setIsLoadingTemplates(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("載入樣板失敗:", err);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [isCreateMode]);

  // 當對話框開啟時重置表單並載入樣板
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setUrl(initialData?.url ?? "");
      setIsActive(initialData?.isActive ?? true);
      setSelectedTemplateId(null);
      setIsTemplateOpen(false);
      if (isCreateMode) {
        fetchTemplates();
      }
    }
  }, [open, initialData, isCreateMode, fetchTemplates]);

  // 取得選中的樣板
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name,
        url,
        isActive,
        templateId: selectedTemplateId ?? undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("提交失敗:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#313338] border-[#1e1f22] text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-[#b5bac1]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 名稱欄位 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#b5bac1]">
              名稱
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：通知頻道"
              required
              className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78] focus:border-[#5865f2]"
            />
          </div>

          {/* URL 欄位 */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-[#b5bac1]">
              Webhook URL
            </Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              required
              className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78] focus:border-[#5865f2]"
            />
          </div>

          {/* 啟用狀態 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive" className="text-[#b5bac1]">
              啟用狀態
            </Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* 套用樣板（僅新增模式顯示） */}
          {isCreateMode && (
            <Collapsible
              open={isTemplateOpen}
              onOpenChange={setIsTemplateOpen}
              className="rounded-md border border-[#404249] bg-[#2b2d31]"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#b5bac1]">
                      套用樣板（選填）
                    </span>
                    {selectedTemplate && (
                      <Badge className="bg-[#5865f2] text-white">
                        {selectedTemplate.name}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#949ba4] transition-transform ${
                      isTemplateOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-[#404249] p-3">
                  {isLoadingTemplates ? (
                    <p className="text-center text-sm text-[#949ba4]">
                      載入中...
                    </p>
                  ) : templates.length === 0 ? (
                    <p className="text-center text-sm text-[#949ba4]">
                      尚無可用樣板
                    </p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2 pr-3">
                        {templates.map((template) => {
                          const isSelected = selectedTemplateId === template.id;
                          const embedColor = template.embedData?.color
                            ? `#${template.embedData.color
                                .toString(16)
                                .padStart(6, "0")}`
                            : undefined;

                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() =>
                                setSelectedTemplateId(
                                  isSelected ? null : template.id
                                )
                              }
                              className={`w-full rounded-md border p-2 text-left transition-all ${
                                isSelected
                                  ? "border-[#5865f2] bg-[#5865f2]/10"
                                  : "border-[#1e1f22] bg-[#1e1f22] hover:border-[#404249]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {embedColor && (
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{ backgroundColor: embedColor }}
                                    />
                                  )}
                                  <span className="text-sm text-white">
                                    {template.name}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="bg-[#404249] text-[#949ba4]"
                                  >
                                    {getScheduleTypeLabel(
                                      template.scheduleType
                                    )}
                                  </Badge>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-[#5865f2]" />
                                )}
                              </div>
                              {template.description && (
                                <p className="mt-1 line-clamp-1 text-xs text-[#949ba4]">
                                  {template.description}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <DialogFooter>
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
              disabled={isSubmitting}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              {isSubmitting ? "處理中..." : initialData ? "儲存" : "新增"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
