"use client";

import * as React from "react";
import { FileText, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { TemplateData } from "@/components/template/TemplateCard";
import { ScheduleType } from "@/types/template";

/* ============================================
   工具函式
   ============================================ */

/**
 * 取得排程類型的顯示文字
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

/* ============================================
   TemplateItem 元件
   樣板列表中的單一項目
   ============================================ */

interface TemplateItemProps {
  template: TemplateData;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateItem({ template, isSelected, onSelect }: TemplateItemProps) {
  const embedColor = template.embedData?.color
    ? `#${template.embedData.color.toString(16).padStart(6, "0")}`
    : undefined;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition-all ${
        isSelected
          ? "border-[#5865f2] bg-[#5865f2]/10"
          : "border-[#1e1f22] bg-[#2b2d31] hover:border-[#404249]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {/* 樣板名稱 */}
          <div className="flex items-center gap-2">
            {embedColor && (
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: embedColor }}
              />
            )}
            <span className="font-medium text-white">{template.name}</span>
          </div>

          {/* 描述 */}
          {template.description && (
            <p className="line-clamp-1 text-sm text-[#b5bac1]">
              {template.description}
            </p>
          )}

          {/* 標籤 */}
          <Badge variant="secondary" className="bg-[#404249] text-[#949ba4]">
            {getScheduleTypeLabel(template.scheduleType)}
          </Badge>
        </div>

        {/* 選中指示 */}
        {isSelected && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5865f2]">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

/* ============================================
   ApplyTemplateDialog 元件
   選擇樣板並套用到 Webhook
   ============================================ */

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string;
  onApplied: () => void;
}

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  webhookId,
  onApplied,
}: ApplyTemplateDialogProps) {
  const [templates, setTemplates] = React.useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<TemplateData | null>(null);
  const [isApplying, setIsApplying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 載入樣板列表
  const fetchTemplates = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("載入失敗");
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchTemplates();
      setSelectedTemplate(null);
      setError(null);
    }
  }, [open, fetchTemplates]);

  // 套用樣板
  const handleApply = async () => {
    if (!selectedTemplate) return;

    setIsApplying(true);
    setError(null);

    try {
      const res = await fetch(`/api/webhooks/${webhookId}/schedules/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplate.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "套用失敗");
      }

      onApplied();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "套用失敗");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] border-[#1e1f22] bg-[#313338] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">套用樣板</DialogTitle>
          <DialogDescription className="text-[#b5bac1]">
            選擇一個樣板來建立新的排程
          </DialogDescription>
        </DialogHeader>

        {/* 樣板列表 */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-[#b5bac1]">載入中...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center">
              <p className="text-[#b5bac1]">尚無樣板</p>
              <p className="text-xs text-[#949ba4]">
                請先到樣板管理頁面建立樣板
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <TemplateItem
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={() => setSelectedTemplate(template)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 錯誤訊息 */}
        {error && <p className="text-sm text-red-400">{error}</p>}

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
            onClick={handleApply}
            disabled={!selectedTemplate || isApplying}
            className="bg-[#5865f2] text-white hover:bg-[#4752c4]"
          >
            {isApplying ? "套用中..." : "套用"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
