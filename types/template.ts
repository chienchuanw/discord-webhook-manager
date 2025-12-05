/**
 * 樣板相關的共用型別定義
 * 這些型別可以在客戶端和伺服器端共用
 */

/* ============================================
   排程類型列舉
   ============================================ */
export enum ScheduleType {
  INTERVAL = "interval",
  DAILY = "daily",
  WEEKLY = "weekly",
}

/* ============================================
   Discord Embed 資料結構
   ============================================ */
export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

