"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * DeleteConfirmDialog 元件屬性
 */
interface DeleteConfirmDialogProps {
  /** 對話框是否開啟 */
  open: boolean;
  /** 關閉對話框的回呼函式 */
  onOpenChange: (open: boolean) => void;
  /** 確認刪除的回呼函式 */
  onConfirm: () => Promise<void>;
  /** 要刪除的 Webhook 名稱 */
  webhookName: string;
}

/**
 * 刪除確認對話框元件
 * 用於確認刪除 Webhook 的操作
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  webhookName,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  // 處理確認刪除
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("刪除失敗:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#313338] border-[#1e1f22] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            確定要刪除嗎？
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#b5bac1]">
            你即將刪除 <span className="font-semibold text-white">{webhookName}</span>。
            此操作無法復原，所有相關的發送記錄也會一併刪除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-[#4e5058] text-white hover:bg-[#4e5058] hover:text-white">
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-[#da373c] hover:bg-[#a12828] text-white"
          >
            {isDeleting ? "刪除中..." : "刪除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

