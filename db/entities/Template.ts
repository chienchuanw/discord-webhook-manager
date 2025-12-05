import { Entity, PrimaryKey, Property, Enum } from "@mikro-orm/core";
import { randomUUID } from "crypto";

/**
 * 從共用型別匯入 ScheduleType 和 EmbedData
 * 這些型別定義在 types/template.ts 中，可以在客戶端和伺服器端共用
 */
import { ScheduleType, type EmbedData } from "@/types/template";
export { ScheduleType, type EmbedData };

/**
 * Template Entity
 * 樣板設定，用於快速套用到 Webhook 排程
 *
 * 欄位說明：
 * - id: 唯一識別碼 (UUID)
 * - name: 樣板名稱
 * - description: 樣板描述（選填）
 * - messageContent: 純文字訊息內容（選填）
 * - embedData: Discord Embed JSON 資料（選填）
 * - imageUrl: 圖片 URL（選填）
 * - scheduleType: 排程類型（interval/daily/weekly）
 * - intervalMinutes: 間隔分鐘數（用於 interval 類型）
 * - scheduleTime: 排程時間 HH:mm 格式（用於 daily/weekly）
 * - scheduleDays: 排程星期幾 JSON 陣列 [0-6]（用於 weekly）
 * - createdAt: 建立時間
 * - updatedAt: 更新時間
 */
@Entity()
export class Template {
  @PrimaryKey({ type: "uuid" })
  id: string = randomUUID();

  /**
   * 樣板名稱
   */
  @Property({ type: "string", length: 255 })
  name!: string;

  /**
   * 樣板描述（選填）
   */
  @Property({ type: "text", nullable: true })
  description?: string;

  /**
   * 純文字訊息內容（選填）
   * 與 embedData 至少需要有一個
   */
  @Property({ type: "text", nullable: true })
  messageContent?: string;

  /**
   * Discord Embed 資料（JSON 格式）
   * 儲存 Discord Embed 的完整結構
   */
  @Property({ type: "json", nullable: true })
  embedData?: EmbedData;

  /**
   * 圖片 URL（選填）
   * 可以是本地上傳的圖片或外部 URL
   */
  @Property({ type: "string", length: 500, nullable: true })
  imageUrl?: string;

  /**
   * 排程類型
   * interval: 固定間隔、daily: 每天、weekly: 每週
   */
  @Enum(() => ScheduleType)
  scheduleType: ScheduleType = ScheduleType.DAILY;

  /**
   * 間隔分鐘數（用於 interval 類型）
   * 例如：30 表示每 30 分鐘發送一次
   */
  @Property({ type: "integer", nullable: true })
  intervalMinutes?: number;

  /**
   * 排程時間（HH:mm 格式，用於 daily/weekly）
   * 例如："09:00" 表示每天/每週 09:00 發送
   */
  @Property({ type: "string", length: 5, nullable: true })
  scheduleTime?: string;

  /**
   * 排程星期幾（JSON 陣列，用於 weekly）
   * 0=週日, 1=週一, ..., 6=週六
   * 例如：[1, 3, 5] 表示每週一、三、五
   */
  @Property({ type: "json", nullable: true })
  scheduleDays?: number[];

  /**
   * 建立時間
   */
  @Property({ type: "datetime" })
  createdAt: Date = new Date();

  /**
   * 更新時間（自動更新）
   */
  @Property({ type: "datetime", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  /**
   * 建構子
   * @param name 樣板名稱
   */
  constructor(name: string) {
    this.name = name;
  }
}
