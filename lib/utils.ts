import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* ============================================
   工具函式
   用於合併 Tailwind CSS 類別名稱
   ============================================ */

/**
 * 合併多個 CSS 類別名稱
 * 使用 clsx 處理條件類別，並用 tailwind-merge 解決 Tailwind 類別衝突
 *
 * @param inputs - 要合併的類別名稱
 * @returns 合併後的類別名稱字串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

