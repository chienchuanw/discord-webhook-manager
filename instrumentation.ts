/**
 * Next.js Instrumentation
 * 在伺服器啟動時執行初始化程式碼
 *
 * 此檔案用於啟動本地 Cron Jobs
 * - 開發環境：模擬 Vercel Cron Jobs
 * - Electron 環境：提供本地排程功能
 */

export async function register() {
  // 僅在 Node.js 運行時環境中執行（排除 Edge Runtime）
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // 檢查是否為 Electron 環境
    const isElectron = process.versions && "electron" in process.versions;

    // 在開發環境或 Electron 環境中啟用本機 cron
    if (process.env.NODE_ENV === "development" || isElectron) {
      const { startLocalCron } = await import("./lib/localCron");
      startLocalCron();

      if (isElectron) {
        console.log("🖥️  Electron 環境：本地 Cron 服務已啟動");
      }
    }
  }
}
