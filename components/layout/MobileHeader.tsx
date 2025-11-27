"use client";

import { Menu } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { SidebarTrigger } from "@/components/ui/sidebar";

/* ============================================
   MobileHeader 元件
   行動裝置專用的頂部導覽列
   包含漢堡選單按鈕用於開啟側邊欄
   ============================================ */
interface MobileHeaderProps {
  title?: string;
}

export function MobileHeader({ title = "Webhook Manger" }: MobileHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
      {/* 側邊欄觸發按鈕 */}
      <SidebarTrigger className="h-9 w-9">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

      {/* Logo 與標題 */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-discord-blurple">
          <FontAwesomeIcon icon={faDiscord} className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-foreground">{title}</span>
      </div>
    </header>
  );
}
