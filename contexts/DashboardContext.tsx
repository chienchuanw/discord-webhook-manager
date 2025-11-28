"use client";

import * as React from "react";
import { type WebhookItem } from "@/components/layout/WebhookSidebar";
import { toast } from "sonner";

/* ============================================
   Webhook 完整資料型別（包含 API 回傳的所有欄位）
   ============================================ */
export interface WebhookData extends WebhookItem {
  url: string;
  createdAt: string;
  updatedAt: string;
}

/* ============================================
   Dashboard Context 型別定義
   提供 webhook 資料與操作給所有子頁面使用
   ============================================ */
interface DashboardContextType {
  // 資料狀態
  webhooks: WebhookData[];
  setWebhooks: React.Dispatch<React.SetStateAction<WebhookData[]>>;
  isLoading: boolean;

  // API 操作
  fetchWebhooks: () => Promise<void>;
  handleTestSend: (id: string) => Promise<void>;
  handleToggleActive: (id: string, isActive: boolean) => Promise<void>;

  // 對話框狀態控制（由各頁面管理，但需要讓 sidebar 能觸發）
  openAddDialog: () => void;
  openEditDialog: (id: string) => void;
  openDeleteDialog: (id: string) => void;
  registerDialogHandlers: (handlers: DialogHandlers) => void;
}

interface DialogHandlers {
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const DashboardContext = React.createContext<DashboardContextType | null>(null);

/* ============================================
   useDashboard Hook
   讓子元件可以存取 Dashboard Context
   ============================================ */
export function useDashboard() {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}

/* ============================================
   DashboardProvider 元件
   提供 webhook 資料管理與共用操作
   ============================================ */
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  // Webhook 列表狀態
  const [webhooks, setWebhooks] = React.useState<WebhookData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // 對話框處理函式（由首頁註冊）
  const dialogHandlersRef = React.useRef<DialogHandlers | null>(null);

  // 載入所有 Webhooks
  const fetchWebhooks = React.useCallback(async () => {
    try {
      const response = await fetch("/api/webhooks");
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error("載入 Webhooks 失敗:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始載入
  React.useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // 測試發送
  const handleTestSend = React.useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/webhooks/${id}/test`, {
          method: "POST",
        });
        const result = await response.json();

        if (result.success) {
          await fetchWebhooks();
          toast.success("測試訊息發送成功！", {
            description: "Webhook 已成功發送測試訊息到 Discord",
          });
        } else {
          toast.error("發送失敗", { description: result.error || "未知錯誤" });
        }
      } catch (error) {
        console.error("測試發送失敗:", error);
        toast.error("發送失敗", {
          description: "網路錯誤，請檢查網路連線後再試",
        });
      }
    },
    [fetchWebhooks]
  );

  // 切換啟用狀態
  const handleToggleActive = React.useCallback(
    async (id: string, isActive: boolean) => {
      try {
        const response = await fetch(`/api/webhooks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        });

        if (response.ok) {
          setWebhooks((prev) =>
            prev.map((w) => (w.id === id ? { ...w, isActive } : w))
          );
        }
      } catch (error) {
        console.error("更新狀態失敗:", error);
      }
    },
    []
  );

  // 對話框觸發函式
  const openAddDialog = React.useCallback(() => {
    dialogHandlersRef.current?.onAdd();
  }, []);

  const openEditDialog = React.useCallback((id: string) => {
    dialogHandlersRef.current?.onEdit(id);
  }, []);

  const openDeleteDialog = React.useCallback((id: string) => {
    dialogHandlersRef.current?.onDelete(id);
  }, []);

  const registerDialogHandlers = React.useCallback(
    (handlers: DialogHandlers) => {
      dialogHandlersRef.current = handlers;
    },
    []
  );

  const contextValue: DashboardContextType = {
    webhooks,
    setWebhooks,
    isLoading,
    fetchWebhooks,
    handleTestSend,
    handleToggleActive,
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    registerDialogHandlers,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
