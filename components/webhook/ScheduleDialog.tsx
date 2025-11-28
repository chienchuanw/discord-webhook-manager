"use client";

import * as React from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ============================================
   ScheduleDialog 元件
   預約發送訊息的對話框
   ============================================ */
/**
 * 預約訊息的資料結構（API 回傳）
 */
export interface ScheduledMessageData {
  id: string;
  content: string;
  status: string;
  sentAt: string;
  scheduledAt: string;
  scheduledStatus: string;
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageContent: string;
  webhookId: string;
  /** 預約成功時的回調，傳入新建立的訊息資料 */
  onScheduled: (messageLog: ScheduledMessageData) => void;
}

// 快捷選項定義
const QUICK_OPTIONS = [
  { label: "10 分鐘後", minutes: 10 },
  { label: "30 分鐘後", minutes: 30 },
  { label: "1 小時後", minutes: 60 },
  { label: "明天同一時間", minutes: 24 * 60 },
] as const;

export function ScheduleDialog({
  open,
  onOpenChange,
  messageContent,
  webhookId,
  onScheduled,
}: ScheduleDialogProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = React.useState<string>("12");
  const [selectedMinute, setSelectedMinute] = React.useState<string>("00");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 重置狀態並設定預設值（今天日期 + 現在時間 + 1 分鐘）
  React.useEffect(() => {
    if (open) {
      const now = new Date();
      // 加上 1 分鐘
      const defaultTime = new Date(now.getTime() + 60 * 1000);

      setSelectedDate(defaultTime);
      setSelectedHour(defaultTime.getHours().toString().padStart(2, "0"));
      setSelectedMinute(defaultTime.getMinutes().toString().padStart(2, "0"));
      setError(null);
    }
  }, [open]);

  // 處理快捷選項點擊
  const handleQuickOption = (minutes: number) => {
    const scheduledAt = new Date(Date.now() + minutes * 60 * 1000);
    submitSchedule(scheduledAt);
  };

  // 處理自訂時間提交
  const handleCustomSubmit = () => {
    if (!selectedDate) {
      setError("請選擇日期");
      return;
    }

    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(
      parseInt(selectedHour),
      parseInt(selectedMinute),
      0,
      0
    );

    if (scheduledAt <= new Date()) {
      setError("預約時間必須在未來");
      return;
    }

    submitSchedule(scheduledAt);
  };

  // 提交預約
  const submitSchedule = async (scheduledAt: Date) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/webhooks/${webhookId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          scheduledAt: scheduledAt.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 傳入 API 回傳的訊息資料
        onScheduled(data.messageLog);
        onOpenChange(false);
      } else {
        setError(data.error || "預約失敗");
      }
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 產生小時選項
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // 產生分鐘選項
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            預約發送
          </DialogTitle>
          <DialogDescription>
            選擇訊息發送時間，訊息將在指定時間自動發送。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 訊息預覽 */}
          <div className="rounded-lg border border-border bg-input/50 p-3">
            <p className="text-xs text-muted-foreground">訊息內容</p>
            <p className="mt-1 line-clamp-3 text-sm">{messageContent}</p>
          </div>

          {/* 快捷選項 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">快捷選項</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_OPTIONS.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickOption(option.minutes)}
                  disabled={isSubmitting}
                  className="justify-start"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 自訂時間 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">自訂時間</p>
            <div className="flex flex-wrap gap-2">
              {/* 日期選擇器 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "yyyy/MM/dd", { locale: zhTW })
                      : "選擇日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* 時間選擇器 */}
              <div className="flex items-center gap-1">
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select
                  value={selectedMinute}
                  onValueChange={setSelectedMinute}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            onClick={handleCustomSubmit}
            disabled={!selectedDate || isSubmitting}
            className="gap-2 bg-discord-blurple text-white hover:bg-discord-blurple/80"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                預約中...
              </>
            ) : (
              "確認預約"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
