/**
 * ScheduleTrigger Service
 * 處理 WebhookSchedule 的觸發與發送邏輯
 * 支援純文字、Embed、圖片發送
 */
import { EntityManager } from "@mikro-orm/postgresql";
import { WebhookSchedule } from "../db/entities/WebhookSchedule";
import { ScheduleType, type EmbedData } from "../db/entities/Template";

/* ============================================
   型別定義
   ============================================ */

/**
 * Discord Webhook 訊息 Payload
 */
interface DiscordPayload {
  content?: string;
  embeds?: EmbedData[];
}

/**
 * 發送結果
 */
export interface SendResult {
  success: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * 處理排程的結果
 */
export interface ProcessResult extends SendResult {
  scheduleId: string;
  scheduleName: string;
}

/* ============================================
   核心函式
   ============================================ */

/**
 * 建立 Discord Webhook 訊息 Payload
 * 根據排程設定組裝 content 和 embeds
 *
 * @param schedule WebhookSchedule 實體
 * @returns Discord Webhook Payload
 */
export function buildDiscordPayload(schedule: WebhookSchedule): DiscordPayload {
  const payload: DiscordPayload = {};

  // 純文字訊息
  if (schedule.messageContent) {
    payload.content = schedule.messageContent;
  }

  // Embed 訊息
  if (schedule.embedData) {
    const embed: EmbedData = { ...schedule.embedData };

    // 如果有圖片 URL，加入 Embed 的 image 欄位
    if (schedule.imageUrl) {
      embed.image = { url: schedule.imageUrl };
    }

    payload.embeds = [embed];
  } else if (schedule.imageUrl) {
    // 只有圖片沒有 Embed 時，建立一個只有圖片的 Embed
    payload.embeds = [{ image: { url: schedule.imageUrl } }];
  }

  return payload;
}

/**
 * 取得所有到期的排程
 * 條件：isActive = true, nextTriggerAt <= 現在時間
 *
 * @param em EntityManager 實例
 * @returns 到期的 WebhookSchedule 陣列
 */
export async function getDueSchedules(
  em: EntityManager
): Promise<WebhookSchedule[]> {
  const now = new Date();

  return em.find(
    WebhookSchedule,
    {
      isActive: true,
      nextTriggerAt: { $lte: now },
    },
    { populate: ["webhook"] }
  );
}

/**
 * 發送單一排程訊息
 *
 * @param em EntityManager 實例
 * @param schedule WebhookSchedule 實體
 * @returns 發送結果
 */
export async function sendScheduleMessage(
  em: EntityManager,
  schedule: WebhookSchedule
): Promise<SendResult> {
  const webhook = schedule.webhook;

  // 檢查 Webhook 是否啟用
  if (!webhook.isActive) {
    return { success: false, error: "Webhook 已停用" };
  }

  // 建立 payload
  const payload = buildDiscordPayload(schedule);

  // 發送到 Discord
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const statusCode = response.status;

    if (response.ok) {
      // 更新 Webhook 統計
      webhook.successCount += 1;
      webhook.lastUsed = new Date();
      await em.flush();

      return { success: true, statusCode };
    } else {
      // 發送失敗
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch {
        errorMessage = `HTTP ${statusCode}`;
      }

      webhook.failCount += 1;
      await em.flush();

      return { success: false, error: errorMessage, statusCode };
    }
  } catch (error) {
    // 網路錯誤
    const errorMessage = error instanceof Error ? error.message : String(error);
    webhook.failCount += 1;
    await em.flush();

    return { success: false, error: errorMessage };
  }
}

/**
 * 計算下次觸發時間
 *
 * @param schedule WebhookSchedule 實體
 * @param fromTime 從哪個時間點開始計算（預設為現在）
 * @returns 下次觸發的 Date
 */
export function calculateNextTriggerTime(
  schedule: WebhookSchedule,
  fromTime: Date = new Date()
): Date {
  const { scheduleType, intervalMinutes, scheduleTime, scheduleDays } =
    schedule;

  switch (scheduleType) {
    case ScheduleType.INTERVAL: {
      // 固定間隔：從現在起加上間隔分鐘數
      const minutes = intervalMinutes ?? 60;
      return new Date(fromTime.getTime() + minutes * 60 * 1000);
    }

    case ScheduleType.DAILY: {
      // 每日固定時間
      const [hours, minutes] = (scheduleTime ?? "09:00").split(":").map(Number);
      const next = new Date(fromTime);
      next.setHours(hours, minutes, 0, 0);

      // 如果今天的時間已過，設為明天
      if (next <= fromTime) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }

    case ScheduleType.WEEKLY: {
      // 每週固定時間與星期
      const [hours, minutes] = (scheduleTime ?? "09:00").split(":").map(Number);
      const days = scheduleDays ?? [1]; // 預設週一
      const currentDay = fromTime.getDay();

      // 找出下一個符合的星期幾
      let daysToAdd = 7;
      for (const day of days.sort((a, b) => a - b)) {
        let diff = day - currentDay;
        if (diff < 0) diff += 7;

        // 如果是今天，檢查時間是否已過
        if (diff === 0) {
          const todayTarget = new Date(fromTime);
          todayTarget.setHours(hours, minutes, 0, 0);
          if (todayTarget > fromTime) {
            daysToAdd = 0;
            break;
          }
          diff = 7; // 今天已過，找下一週
        }

        if (diff < daysToAdd) {
          daysToAdd = diff;
        }
      }

      // 如果所有日期都在本週之前，找下一週第一個符合的日期
      if (daysToAdd === 7) {
        const firstDay = days.sort((a, b) => a - b)[0];
        daysToAdd = (firstDay - currentDay + 7) % 7 || 7;
      }

      const next = new Date(fromTime);
      next.setDate(next.getDate() + daysToAdd);
      next.setHours(hours, minutes, 0, 0);
      return next;
    }

    default:
      // 預設 1 小時後
      return new Date(fromTime.getTime() + 60 * 60 * 1000);
  }
}

/**
 * 處理所有到期的排程
 * 發送訊息並更新下次觸發時間
 *
 * @param em EntityManager 實例
 * @returns 處理結果陣列
 */
export async function processSchedules(
  em: EntityManager
): Promise<ProcessResult[]> {
  const dueSchedules = await getDueSchedules(em);
  const results: ProcessResult[] = [];

  for (const schedule of dueSchedules) {
    // 發送訊息
    const sendResult = await sendScheduleMessage(em, schedule);

    // 更新觸發時間
    schedule.lastTriggeredAt = new Date();
    schedule.nextTriggerAt = calculateNextTriggerTime(schedule);
    await em.flush();

    results.push({
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      ...sendResult,
    });
  }

  return results;
}
