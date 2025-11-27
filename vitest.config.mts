import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Vitest 測試配置
 * 設定測試環境、路徑別名等
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // 預設使用 node 環境（服務層測試）
    environment: "node",
    // 全域可用的測試函式（describe, it, expect 等）
    globals: true,
    // 測試檔案的匹配模式
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // 排除的目錄
    exclude: ["node_modules", ".next"],
    // 設定檔案執行前的 setup
    setupFiles: ["./vitest.setup.ts"],
    // 針對不同測試檔案使用不同環境
    environmentMatchGlobs: [
      // 元件測試使用 jsdom
      ["**/*.test.tsx", "jsdom"],
      ["components/**/*.test.ts", "jsdom"],
    ],
    // 序列執行測試（避免資料庫競爭）
    fileParallelism: false,
    // 覆蓋率設定
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", ".next", "**/*.config.*"],
    },
  },
  resolve: {
    // 路徑別名，對應 tsconfig.json 的 paths
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
