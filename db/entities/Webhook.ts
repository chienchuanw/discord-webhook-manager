import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
} from "@mikro-orm/core";
import { randomUUID } from "crypto";

// 使用 type import 來避免循環依賴
// 搭配字串形式的 entity 名稱，讓 MikroORM 在 bundler 環境中正確解析
import type { MessageLog } from "./MessageLog";
import type { WebhookSchedule } from "./WebhookSchedule";

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
  @PrimaryKey({ type: "text" })
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
   * 訊息記錄列表
   * 使用 OneToMany 建立一對多關係
   * 使用字串形式的 entity 名稱和 mappedBy，避免循環依賴問題
   */
  @OneToMany("MessageLog", "webhook")
  messageLogs = new Collection<MessageLog>(this);

  /**
   * 排程列表
   * 使用 OneToMany 建立一對多關係
   * 使用字串形式的 entity 名稱和 mappedBy，避免循環依賴問題
   */
  @OneToMany("WebhookSchedule", "webhook")
  schedules = new Collection<WebhookSchedule>(this);

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
