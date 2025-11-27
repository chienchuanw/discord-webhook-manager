import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { randomUUID } from "crypto";

/**
 * Webhook Entity
 * 代表一個 Discord Webhook 的資料模型
 *
 * 欄位說明：
 * - id: 唯一識別碼 (UUID)
 * - name: Webhook 名稱
 * - url: Discord Webhook URL
 * - isActive: 是否啟用
 * - successCount: 成功發送次數
 * - failCount: 失敗發送次數
 * - lastUsed: 最後使用時間
 * - createdAt: 建立時間
 * - updatedAt: 更新時間
 */
@Entity()
export class Webhook {
  @PrimaryKey({ type: "uuid" })
  id: string = randomUUID();

  @Property({ type: "string", length: 255 })
  name!: string;

  @Property({ type: "string", length: 500 })
  url!: string;

  @Property({ type: "boolean", default: true })
  isActive: boolean = true;

  @Property({ type: "integer", default: 0 })
  successCount: number = 0;

  @Property({ type: "integer", default: 0 })
  failCount: number = 0;

  @Property({ type: "datetime", nullable: true })
  lastUsed?: Date;

  @Property({ type: "datetime" })
  createdAt: Date = new Date();

  @Property({ type: "datetime", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  /**
   * 建構子
   * @param name Webhook 名稱
   * @param url Discord Webhook URL
   */
  constructor(name: string, url: string) {
    this.name = name;
    this.url = url;
  }
}
