import { defineConfig } from "@mikro-orm/sqlite";
import { Migrator } from "@mikro-orm/migrations";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import * as dotenv from "dotenv";
import * as path from "path";
import { Webhook } from "./db/entities/Webhook";
import { MessageLog } from "./db/entities/MessageLog";
import { Template } from "./db/entities/Template";
import { WebhookSchedule } from "./db/entities/WebhookSchedule";

// 根據環境載入對應的環境變數檔
// 測試環境：vitest.setup.ts 會先載入 .env.test
// 開發環境：若尚未載入則載入 .env.local
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
  // 如果環境變數有指定路徑，直接使用
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // 預設使用專案根目錄下的 data 資料夾
  return path.join(process.cwd(), "data", "app.db");
}

/**
 * MikroORM 配置檔
 * 定義 SQLite 資料庫連線及 ORM 設定
 */
export default defineConfig({
  // SQLite 資料庫檔案路徑
  dbName: getDatabasePath(),

  // Entity 類別（直接引入，避免 glob 路徑問題）
  entities: [Webhook, MessageLog, Template, WebhookSchedule],

  // 開發模式設定（非 production 環境啟用 debug 日誌）
  debug: process.env.NODE_ENV !== "production",

  // SQL 語法高亮（讓終端機的 SQL 日誌更易讀）
  highlighter: new SqlHighlighter(),

  // 擴充功能
  extensions: [Migrator],

  // Migration 設定
  migrations: {
    path: "./db/migrations-sqlite",
    pathTs: "./db/migrations-sqlite",
    glob: "!(*.d).{js,ts}",
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    emit: "ts",
  },
});
