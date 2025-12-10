"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, MoreVertical, Circle } from "lucide-react";
import { DiscordIcon } from "@/components/icons";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ============================================
   Webhook 資料型別定義
   ============================================ */
export interface WebhookItem {
  id: string;
  name: string;
  isActive: boolean;
  lastUsed?: string;
}

interface WebhookSidebarProps {
  webhooks: WebhookItem[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTestSend: (id: string) => void;
}

/* ============================================
   WebhookSidebar 元件
   Discord 風格的側邊欄，顯示 Webhook 列表
   ============================================ */
export function WebhookSidebar({
  webhooks,
  onAdd,
  onEdit,
  onDelete,
  onTestSend,
}: WebhookSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState("");

  // 根據搜尋關鍵字過濾 Webhook
  const filteredWebhooks = React.useMemo(() => {
    if (!searchQuery.trim()) return webhooks;
    return webhooks.filter((w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [webhooks, searchQuery]);

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* 側邊欄標題區域 */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Webhook Manager
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-discord-green/20 hover:text-discord-green"
                onClick={onAdd}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">新增 Webhook</TooltipContent>
          </Tooltip>
        </div>

        {/* 搜尋輸入框 */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋 Webhook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 bg-input pl-8 text-sm placeholder:text-muted-foreground"
          />
        </div>
      </SidebarHeader>

      {/* Webhook 列表區域 */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Webhooks ({filteredWebhooks.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {/* 使用 space-y-2 增加項目之間的間距 */}
            <SidebarMenu className="space-y-2">
              {filteredWebhooks.map((webhook) => (
                <WebhookListItem
                  key={webhook.id}
                  webhook={webhook}
                  isSelected={pathname === `/webhooks/${webhook.id}`}
                  onEdit={() => onEdit(webhook.id)}
                  onDelete={() => onDelete(webhook.id)}
                  onTestSend={() => onTestSend(webhook.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 側邊欄底部導覽區域 - 放置「樣板管理」連結 */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/templates">
                <span>樣板管理</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

/* ============================================
   WebhookListItem 元件
   單一 Webhook 項目的顯示，使用 Link 導航到 /webhooks/[slug]
   ============================================ */
interface WebhookListItemProps {
  webhook: WebhookItem;
  isSelected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTestSend: () => void;
}

function WebhookListItem({
  webhook,
  isSelected,
  onEdit,
  onDelete,
  onTestSend,
}: WebhookListItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isSelected}
        className="group relative pr-8"
      >
        {/* 使用 Link 導航到 /webhooks/[slug] */}
        <Link href={`/webhooks/${webhook.id}`}>
          {/* Webhook 圖示與狀態指示 */}
          <div className="relative">
            <DiscordIcon className="h-4 w-4 text-muted-foreground" />
            {/* 狀態指示燈 */}
            <Circle
              className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 fill-current ${
                webhook.isActive
                  ? "text-discord-green"
                  : "text-muted-foreground"
              }`}
            />
          </div>

          {/* Webhook 名稱與統計 */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{webhook.name}</span>
          </div>
        </Link>
      </SidebarMenuButton>

      {/* 操作選單 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onTestSend}>
            <span className="text-discord-blurple">測試發送</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>編輯</DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            刪除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
