import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import * as dotenv from "dotenv";
import { Webhook } from "./db/entities/Webhook";
import { MessageLog } from "./db/entities/MessageLog";

// 根據環境載入對應的環境變數檔
// 測試環境：vitest.setup.ts 會先載入 .env.test
// 開發環境：若尚未載入則載入 .env.local
if (!process.env.DATABASE_NAME) {
  dotenv.config({ path: ".env.local" });
}

/**
 * MikroORM 配置檔
 * 定義資料庫連線及 ORM 設定
 */
export default defineConfig({
  // 資料庫連線設定
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
  dbName: process.env.DATABASE_NAME || "db_discord_webhook_manager",

  // Entity 類別（直接引入，避免 glob 路徑問題）
  entities: [Webhook, MessageLog],

  // 開發模式設定（非 production 環境啟用 debug 日誌）
  debug: process.env.NODE_ENV !== "production",

  // SQL 語法高亮（讓終端機的 SQL 日誌更易讀）
  highlighter: new SqlHighlighter(),

  // 擴充功能
  extensions: [Migrator],

  // Migration 設定
  migrations: {
    path: "./db/migrations",
    pathTs: "./db/migrations",
    glob: "!(*.d).{js,ts}",
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    emit: "ts",
  },
});
