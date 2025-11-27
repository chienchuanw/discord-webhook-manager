/**
 * Next.js Instrumentation
 * 在伺服器啟動時執行初始化程式碼
 *
 * 此檔案用於在開發環境中模擬 Vercel Cron Jobs
 * 每分鐘自動檢查並發送到期的預約訊息
 */

export async function register() {
  // 僅在 Node.js 運行時環境中執行（排除 Edge Runtime）
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // 僅在開發環境中啟用本機 cron 模擬
    if (process.env.NODE_ENV === "development") {
      const { startLocalCron } = await import("./lib/localCron");
      startLocalCron();
    }
  }
}

