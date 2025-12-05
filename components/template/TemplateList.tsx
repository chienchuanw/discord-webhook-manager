"use client";

import * as React from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateCard, type TemplateData } from "./TemplateCard";
import {
  TemplateFormDialog,
  type TemplateFormData,
} from "./TemplateFormDialog";
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

/* ============================================
   TemplateList 元件
   樣板列表頁面的主要元件
   ============================================ */

export function TemplateList() {
  // 樣板資料
  const [templates, setTemplates] = React.useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 對話框狀態
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] =
    React.useState<TemplateData | null>(null);
  const [deletingTemplate, setDeletingTemplate] =
    React.useState<TemplateData | null>(null);

  // 載入樣板列表
  const fetchTemplates = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("載入失敗");
      const data = await res.json();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // 新增樣板
  const handleCreate = async (data: TemplateFormData) => {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("新增失敗");
    await fetchTemplates();
  };

  // 更新樣板
  const handleUpdate = async (data: TemplateFormData) => {
    if (!editingTemplate) return;
    const res = await fetch(`/api/templates/${editingTemplate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("更新失敗");
    await fetchTemplates();
    setEditingTemplate(null);
  };

  // 刪除樣板
  const handleDelete = async () => {
    if (!deletingTemplate) return;
    const res = await fetch(`/api/templates/${deletingTemplate.id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("刪除失敗");
    await fetchTemplates();
    setDeletingTemplate(null);
  };

  // 開啟編輯對話框
  const openEditDialog = (template: TemplateData) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  // 關閉表單對話框
  const closeFormDialog = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingTemplate(null);
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-[#b5bac1]">載入中...</div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error}</p>
        <Button onClick={fetchTemplates} variant="outline">
          重試
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題與新增按鈕 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">樣板管理</h1>
          <p className="text-sm text-[#b5bac1]">
            建立可重複使用的訊息樣板，快速套用到 Webhook 排程
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#5865f2] text-white hover:bg-[#4752c4]"
        >
          <Plus className="mr-2 h-4 w-4" />
          新增樣板
        </Button>
      </div>

      {/* 樣板列表 */}
      {templates.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[#1e1f22] bg-[#2b2d31]">
          <p className="mb-2 text-lg font-medium text-white">尚無樣板</p>
          <p className="mb-4 text-sm text-[#b5bac1]">
            建立第一個樣板來開始使用
          </p>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#5865f2] text-white hover:bg-[#4752c4]"
          >
            <Plus className="mr-2 h-4 w-4" />
            新增樣板
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => openEditDialog(template)}
              onDelete={() => setDeletingTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* 新增/編輯對話框 */}
      <TemplateFormDialog
        open={isFormOpen}
        onOpenChange={closeFormDialog}
        onSubmit={editingTemplate ? handleUpdate : handleCreate}
        initialData={editingTemplate ?? undefined}
        title={editingTemplate ? "編輯樣板" : "新增樣板"}
        description={
          editingTemplate
            ? "修改樣板的內容與設定"
            : "建立一個可重複使用的訊息樣板"
        }
      />

      {/* 刪除確認對話框 */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
      >
        <AlertDialogContent className="border-[#1e1f22] bg-[#313338]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              確定要刪除嗎？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#b5bac1]">
              刪除樣板「{deletingTemplate?.name}
              」後將無法復原。已套用此樣板的排程不會受到影響。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1e1f22] bg-transparent text-white hover:bg-[#4e5058]">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
