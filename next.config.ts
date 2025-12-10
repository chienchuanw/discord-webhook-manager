import type { NextConfig } from "next";

/**
 * Next.js 配置
 * 設定 serverExternalPackages 避免 MikroORM 相關套件被打包
 * 這些套件需要在 Node.js 環境執行，不應被 Turbopack 處理
 *
 * Electron 支援：
 * - 保留 SSR 和 API Routes 功能
 * - Next.js 會在 Electron 中以伺服器模式運行
 * - 不使用靜態匯出，以保留所有動態功能
 *
 * 注意：Next.js 16+ 已預設支援 instrumentation.ts，不需額外設定
 */
const nextConfig: NextConfig = {
  // 將資料庫相關套件設為外部套件，避免打包錯誤
  serverExternalPackages: [
    "@mikro-orm/core",
    "@mikro-orm/sqlite",
    "@mikro-orm/knex",
    "@mikro-orm/migrations",
    "pg",
    "pg-native",
    "better-sqlite3",
    "sqlite3",
    "mysql",
    "mysql2",
    "oracledb",
    "tedious",
    "node-cron",
  ],

  // Electron 環境下的特殊設定
  ...(process.env.IS_ELECTRON === "true" &&
    {
      // 可以在這裡加入 Electron 特定的設定
      // 例如：調整 webpack 配置、修改輸出路徑等
    }),
};

export default nextConfig;
