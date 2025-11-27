import type { NextConfig } from "next";

/**
 * Next.js 配置
 * 設定 serverExternalPackages 避免 MikroORM 相關套件被打包
 * 這些套件需要在 Node.js 環境執行，不應被 Turbopack 處理
 */
const nextConfig: NextConfig = {
  // 將資料庫相關套件設為外部套件，避免打包錯誤
  serverExternalPackages: [
    "@mikro-orm/core",
    "@mikro-orm/postgresql",
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
  ],
};

export default nextConfig;
