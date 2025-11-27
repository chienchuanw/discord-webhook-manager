import { defineConfig } from "@mikro-orm/postgresql";
import { Migrator } from "@mikro-orm/migrations";
import * as dotenv from "dotenv";
import { Webhook } from "./db/entities/Webhook";
import { MessageLog } from "./db/entities/MessageLog";

// 載入環境變數
dotenv.config({ path: ".env.local" });

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

  // 開發模式設定
  debug: process.env.NODE_ENV !== "production",

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
