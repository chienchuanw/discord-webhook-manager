/**
 * Local Cron Service
 * 在開發環境中模擬 Vercel Cron Jobs
 *
 * 使用 node-cron 套件每分鐘執行一次預約訊息發送檢查
 * 僅在 NODE_ENV === 'development' 時啟用
 */

import cron from "node-cron";

// 追蹤是否已啟動，避免重複啟動
let isStarted = false;

/**
 * 呼叫 cron API 觸發預約訊息發送
 */
async function triggerScheduledSend(): Promise<void> {
  try {
    // 優先使用環境變數，否則根據 PORT 環境變數或預設 3000
    const port = process.env.PORT || "3000";
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${port}`;
    const response = await fetch(`${baseUrl}/api/cron/send-scheduled`, {
      method: "GET",
      headers: {
        // 在開發環境中模擬 Vercel Cron 的驗證標頭
        Authorization: `Bearer ${
          process.env.CRON_SECRET || "development-secret"
        }`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.processed > 0) {
        console.log(
          `[Local Cron] 已處理 ${data.processed} 則預約訊息，成功: ${data.successful}，失敗: ${data.failed}`
        );
      }
    } else {
      console.error(`[Local Cron] 發送失敗: HTTP ${response.status}`);
    }
  } catch (error) {
    // 伺服器啟動初期可能還未準備好，忽略連線錯誤
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      // 靜默忽略連線拒絕錯誤
      return;
    }
    console.error("[Local Cron] 執行錯誤:", error);
  }
}

/**
 * 啟動本機 cron 服務
 * 每分鐘執行一次預約訊息發送檢查
 */
export function startLocalCron(): void {
  // 避免重複啟動（Next.js 開發模式可能多次載入）
  if (isStarted) {
    return;
  }

  isStarted = true;
  console.log("[Local Cron] 開發環境 cron 服務已啟動，每分鐘檢查預約訊息...");

  // 每分鐘執行一次（與 Vercel Cron 相同頻率）
  cron.schedule("* * * * *", () => {
    triggerScheduledSend();
  });

  // 啟動後立即執行一次（延遲 5 秒等待伺服器完全啟動）
  setTimeout(() => {
    triggerScheduledSend();
  }, 5000);
}

/**
 * 停止本機 cron 服務（供測試使用）
 */
export function stopLocalCron(): void {
  isStarted = false;
  cron.getTasks().forEach((task) => task.stop());
  console.log("[Local Cron] 服務已停止");
}
