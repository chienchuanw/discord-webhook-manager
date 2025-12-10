import { Entity, PrimaryKey, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { randomUUID } from "crypto";
import { Webhook } from "./Webhook";
import { ScheduleType } from "./Template";
import type { EmbedData } from "./Template";

/**
 * WebhookSchedule Entity
 * Webhook 的排程設定，可從 Template 套用或手動建立
 *
 * 欄位說明：
 * - id: 唯一識別碼 (UUID)
 * - webhook: 關聯的 Webhook（多對一關係）
 * - name: 排程名稱
 * - messageContent: 純文字訊息內容（選填）
 * - embedData: Discord Embed JSON 資料（選填）
 * - imageUrl: 圖片 URL（選填）
 * - scheduleType: 排程類型（interval/daily/weekly）
 * - intervalMinutes: 間隔分鐘數（用於 interval 類型）
 * - scheduleTime: 排程時間 HH:mm 格式（用於 daily/weekly）
 * - scheduleDays: 排程星期幾 JSON 陣列（用於 weekly）
 * - isActive: 此排程是否啟用
 * - lastTriggeredAt: 上次觸發時間
 * - nextTriggerAt: 下次觸發時間
 * - createdAt: 建立時間
 * - updatedAt: 更新時間
 */
@Entity()
export class WebhookSchedule {
  @PrimaryKey({ type: "text" })
  id: string = randomUUID();

  /**
   * 關聯的 Webhook
   * 使用 ManyToOne 建立多對一關係
   */
  @ManyToOne(() => Webhook)
  webhook!: Webhook;

  /**
   * 排程名稱
   */
  @Property({ type: "string", length: 255 })
  name!: string;

  /**
   * 純文字訊息內容（選填）
   */
  @Property({ type: "text", nullable: true })
  messageContent?: string;

  /**
   * Discord Embed 資料（JSON 格式）
   */
  @Property({ type: "json", nullable: true })
  embedData?: EmbedData;

  /**
   * 圖片 URL（選填）
   */
  @Property({ type: "string", length: 500, nullable: true })
  imageUrl?: string;

  /**
   * 排程類型
   */
  @Enum(() => ScheduleType)
  scheduleType: ScheduleType = ScheduleType.DAILY;

  /**
   * 間隔分鐘數（用於 interval 類型）
   */
  @Property({ type: "integer", nullable: true })
  intervalMinutes?: number;

  /**
   * 排程時間（HH:mm 格式，用於 daily/weekly）
   */
  @Property({ type: "string", length: 5, nullable: true })
  scheduleTime?: string;

  /**
   * 排程星期幾（JSON 陣列，用於 weekly）
   * 0=週日, 1=週一, ..., 6=週六
   */
  @Property({ type: "json", nullable: true })
  scheduleDays?: number[];

  /**
   * 此排程是否啟用
   * 注意：即使啟用，若關聯的 Webhook.isActive 為 false，也不會發送
   */
  @Property({ type: "boolean", default: true })
  isActive: boolean = true;

  /**
   * 上次觸發時間
   */
  @Property({ type: "datetime", nullable: true })
  lastTriggeredAt?: Date;

  /**
   * 下次觸發時間
   * 由系統根據排程設定自動計算
   */
  @Property({ type: "datetime", nullable: true })
  nextTriggerAt?: Date;

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
   * @param webhook 關聯的 Webhook
   * @param name 排程名稱
   */
  constructor(webhook: Webhook, name: string) {
    this.webhook = webhook;
    this.name = name;
  }
}
