/**
 * Local Cron Service
 * 在開發環境中模擬 Vercel Cron Jobs
 *
 * 使用 node-cron 套件定期執行排程處理
 * 僅在 NODE_ENV === 'development' 時啟用
 *
 * 環境變數：
 * - CRON_SCHEDULE: cron 表達式，預設每分鐘執行
 *   範例請參考 .env.local 檔案
 */

import cron from "node-cron";

// 追蹤是否已啟動，避免重複啟動
let isStarted = false;

// 預設 cron 表達式：每分鐘執行
const DEFAULT_CRON_SCHEDULE = "* * * * *";

/**
 * 取得基礎 URL
 */
function getBaseUrl(): string {
  const port = process.env.PORT || "3000";
  return process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${port}`;
}

/**
 * 呼叫 cron API 處理 WebhookSchedule 排程
 */
async function triggerProcessSchedules(): Promise<void> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/cron/process-schedules`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${
          process.env.CRON_SECRET || "development-secret"
        }`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.processed > 0) {
        console.log(`[Local Cron] 已處理 ${data.processed} 則排程訊息`);
        data.results?.forEach(
          (r: { scheduleName: string; success: boolean; error?: string }) => {
            if (r.success) {
              console.log(`  ✓ ${r.scheduleName}`);
            } else {
              console.log(`  ✗ ${r.scheduleName}: ${r.error}`);
            }
          }
        );
      }
    } else {
      console.error(
        `[Local Cron] process-schedules 失敗: HTTP ${response.status}`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      return;
    }
    console.error("[Local Cron] process-schedules 錯誤:", error);
  }
}

/**
 * 呼叫 cron API 發送預約訊息（舊功能，保留相容性）
 */
async function triggerScheduledSend(): Promise<void> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/cron/send-scheduled`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${
          process.env.CRON_SECRET || "development-secret"
        }`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.processed > 0) {
        console.log(`[Local Cron] 已處理 ${data.processed} 則預約訊息`);
      }
    } else {
      console.error(
        `[Local Cron] send-scheduled 失敗: HTTP ${response.status}`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      return;
    }
    console.error("[Local Cron] send-scheduled 錯誤:", error);
  }
}

/**
 * 執行所有 cron 任務
 */
async function runAllCronTasks(): Promise<void> {
  // 處理 WebhookSchedule 排程（新功能）
  await triggerProcessSchedules();
  // 處理預約訊息（舊功能，保留相容性）
  await triggerScheduledSend();
}

/**
 * 啟動本機 cron 服務
 * 根據 CRON_SCHEDULE 環境變數設定的頻率執行排程處理
 */
export function startLocalCron(): void {
  // 避免重複啟動（Next.js 開發模式可能多次載入）
  if (isStarted) {
    return;
  }

  // 從環境變數讀取 cron 表達式，預設每分鐘執行
  const cronSchedule = process.env.CRON_SCHEDULE || DEFAULT_CRON_SCHEDULE;

  // 驗證 cron 表達式是否有效
  if (!cron.validate(cronSchedule)) {
    console.error(
      `[Local Cron] 無效的 CRON_SCHEDULE: "${cronSchedule}"，使用預設值 "${DEFAULT_CRON_SCHEDULE}"`
    );
  }

  const validSchedule = cron.validate(cronSchedule)
    ? cronSchedule
    : DEFAULT_CRON_SCHEDULE;

  isStarted = true;
  console.log(`[Local Cron] 開發環境 cron 服務已啟動，排程: ${validSchedule}`);

  // 根據環境變數設定的頻率執行
  cron.schedule(validSchedule, () => {
    runAllCronTasks();
  });

  // 啟動後立即執行一次（延遲 5 秒等待伺服器完全啟動）
  setTimeout(() => {
    runAllCronTasks();
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
