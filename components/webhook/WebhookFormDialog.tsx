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
import { Switch } from "@/components/ui/switch";

/**
 * Webhook 表單資料型別
 */
export interface WebhookFormData {
  name: string;
  url: string;
  isActive: boolean;
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

/**
 * Webhook 表單對話框元件
 * 用於新增或編輯 Webhook
 */
export function WebhookFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title = "新增 Webhook",
  description = "輸入 Webhook 的名稱和 Discord Webhook URL",
}: WebhookFormDialogProps) {
  // 表單狀態
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [url, setUrl] = React.useState(initialData?.url ?? "");
  const [isActive, setIsActive] = React.useState(initialData?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 當 initialData 變更時更新表單
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setUrl(initialData?.url ?? "");
      setIsActive(initialData?.isActive ?? true);
    }
  }, [open, initialData]);

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({ name, url, isActive });
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

