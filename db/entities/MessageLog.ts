import { Entity, PrimaryKey, Property, ManyToOne, Enum } from "@mikro-orm/core";
import { randomUUID } from "crypto";
import { Webhook } from "./Webhook";

/**
 * 訊息發送狀態列舉
 * SUCCESS: 發送成功
 * FAILED: 發送失敗
 */
export enum MessageStatus {
  SUCCESS = "success",
  FAILED = "failed",
}

/**
 * MessageLog Entity
 * 記錄每次透過 Webhook 發送的訊息
 *
 * 欄位說明：
 * - id: 唯一識別碼 (UUID)
 * - webhook: 關聯的 Webhook（多對一關係）
 * - content: 發送的訊息內容
 * - status: 發送狀態（成功/失敗）
 * - statusCode: Discord API 回應的 HTTP 狀態碼
 * - errorMessage: 錯誤訊息（發送失敗時記錄）
 * - sentAt: 發送時間
 */
@Entity()
export class MessageLog {
  @PrimaryKey({ type: "uuid" })
  id: string = randomUUID();

  /**
   * 關聯的 Webhook
   * 使用 ManyToOne 建立多對一關係
   */
  @ManyToOne(() => Webhook)
  webhook!: Webhook;

  /**
   * 發送的訊息內容
   * 使用 text 類型以支援較長的訊息
   */
  @Property({ type: "text" })
  content!: string;

  /**
   * 發送狀態
   */
  @Enum(() => MessageStatus)
  status!: MessageStatus;

  /**
   * HTTP 狀態碼
   * Discord API 回應的狀態碼，用於除錯
   */
  @Property({ type: "integer", nullable: true })
  statusCode?: number;

  /**
   * 錯誤訊息
   * 當發送失敗時，記錄錯誤詳情
   */
  @Property({ type: "text", nullable: true })
  errorMessage?: string;

  /**
   * 發送時間
   */
  @Property({ type: "datetime" })
  sentAt: Date = new Date();

  /**
   * 建構子
   * @param webhook 關聯的 Webhook
   * @param content 訊息內容
   * @param status 發送狀態
   */
  constructor(webhook: Webhook, content: string, status: MessageStatus) {
    this.webhook = webhook;
    this.content = content;
    this.status = status;
  }
}

