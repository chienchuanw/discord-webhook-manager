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
 * 注意：使用 .mjs 格式以避免生產環境需要 TypeScript
 */

import TerserPlugin from "terser-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // 禁用 server-side minification
  // MikroORM 使用類別名稱來識別 Entity，minification 會導致 "Duplicate entity names" 錯誤
  // 參考：https://github.com/vercel/next.js/issues/59594
  experimental: {
    serverMinification: false,
  },

  // Webpack 配置：使用 TerserPlugin 保留類別名稱
  // MikroORM 依賴 constructor.name 來識別 Entity
  // 參考：https://mikro-orm.io/docs/deployment#webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 使用 TerserPlugin 並設定保留類別名稱
      // 這是 MikroORM 官方推薦的 Webpack 配置
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            // 禁用 mangle，避免變數名稱被壓縮
            mangle: false,
            // 保留類別名稱和函式名稱
            compress: {
              keep_classnames: true,
              keep_fnames: true,
            },
            // 額外設定：保留類別名稱
            keep_classnames: true,
            keep_fnames: true,
          },
        }),
      ];
    }
    return config;
  },

  // Electron 環境下的特殊設定
  ...(process.env.IS_ELECTRON === "true" && {
    // 可以在這裡加入 Electron 特定的設定
    // 例如：調整 webpack 配置、修改輸出路徑等
  }),
};

export default nextConfig;

