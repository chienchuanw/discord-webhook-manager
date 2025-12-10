import { MikroORM, EntityManager, Options } from "@mikro-orm/sqlite";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// 直接引入 Entity 類別（確保生產環境能正確載入）
import { Webhook } from "./entities/Webhook";
import { MessageLog } from "./entities/MessageLog";
import { Template } from "./entities/Template";
import { WebhookSchedule } from "./entities/WebhookSchedule";

/**
 * 資料庫連線管理模組
 * 使用 singleton pattern 確保只有一個 ORM 實例
 *
 * 注意：此模組直接定義 ORM 配置，以確保生產環境能正確解析 Entity
 */

// 儲存 ORM 實例的全域變數（開發環境下避免 hot reload 重複建立連線）
declare global {
  // eslint-disable-next-line no-var
  var __orm: MikroORM | undefined;
}

// 根據環境載入對應的環境變數檔
if (!process.env.DATABASE_PATH) {
  dotenv.config({ path: ".env.local" });
}

/**
 * 取得資料庫檔案路徑
 * 開發環境：專案根目錄下的 data/app.db
 * 測試環境：專案根目錄下的 data/test.db
 * 生產環境（Electron）：使用者資料目錄下的 app.db
 */
function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  return path.join(process.cwd(), "data", "app.db");
}

/**
 * 確保資料庫目錄存在
 * SQLite 需要目錄存在才能建立資料庫檔案
 */
function ensureDatabaseDirectory(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 建立 MikroORM 配置
 * 直接在此處定義配置，避免生產環境的模組解析問題
 */
function createOrmConfig(): Options {
  return {
    // SQLite 資料庫檔案路徑
    dbName: getDatabasePath(),

    // Entity 類別（直接引入，確保生產環境能正確載入）
    entities: [Webhook, MessageLog, Template, WebhookSchedule],

    // 開發模式設定（非 production 環境啟用 debug 日誌）
    debug: process.env.NODE_ENV !== "production",

    // SQL 語法高亮（讓終端機的 SQL 日誌更易讀）
    highlighter: new SqlHighlighter(),

    // 禁用動態檔案訪問（bundler 環境必須設定，避免 Entity 發現問題）
    discovery: { disableDynamicFileAccess: true },
  };
}

/**
 * 取得 MikroORM 實例
 * 如果尚未初始化則建立新連線
 */
export async function getORM(): Promise<MikroORM> {
  if (!global.__orm) {
    const config = createOrmConfig();

    // 確保資料庫目錄存在
    const dbPath = config.dbName as string;
    ensureDatabaseDirectory(dbPath);

    global.__orm = await MikroORM.init(config);

    // 確保資料表存在
    // 使用 schema generator 自動同步資料表結構
    const generator = global.__orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.updateSchema();
  }
  return global.__orm;
}

/**
 * 取得 EntityManager 實例
 * 用於執行資料庫操作
 */
export async function getEntityManager(): Promise<EntityManager> {
  const orm = await getORM();
  return orm.em.fork();
}

/**
 * 關閉資料庫連線
 * 通常在應用程式結束時呼叫
 */
export async function closeORM(): Promise<void> {
  if (global.__orm) {
    await global.__orm.close();
    global.__orm = undefined;
  }
}
