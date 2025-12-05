/**
 * WebhookSchedule Service
 * 處理 Webhook 排程的 CRUD 操作
 */
import { EntityManager } from "@mikro-orm/postgresql";
import { WebhookSchedule } from "../db/entities/WebhookSchedule";
import { Webhook } from "../db/entities/Webhook";
import {
  Template,
  ScheduleType,
  type EmbedData,
} from "../db/entities/Template";
import { calculateNextTriggerTime } from "./scheduleTriggerService";

/* ============================================
   型別定義
   ============================================ */

/**
 * 建立排程的參數
 */
export interface CreateWebhookScheduleParams {
  webhookId: string;
  name: string;
  messageContent?: string;
  embedData?: EmbedData;
  imageUrl?: string;
  scheduleType?: ScheduleType;
  intervalMinutes?: number;
  scheduleTime?: string;
  scheduleDays?: number[];
  isActive?: boolean;
}

/**
 * 更新排程的參數
 */
export interface UpdateWebhookScheduleParams {
  name?: string;
  messageContent?: string;
  embedData?: EmbedData;
  imageUrl?: string;
  scheduleType?: ScheduleType;
  intervalMinutes?: number;
  scheduleTime?: string;
  scheduleDays?: number[];
  isActive?: boolean;
  nextTriggerAt?: Date;
}

/* ============================================
   CRUD 操作函式
   ============================================ */

/**
 * 建立新的排程
 * @param em EntityManager 實例
 * @param params 建立參數
 * @returns 建立的 WebhookSchedule 實體，若 Webhook 不存在則回傳 null
 */
export async function createWebhookSchedule(
  em: EntityManager,
  params: CreateWebhookScheduleParams
): Promise<WebhookSchedule | null> {
  // 取得 Webhook
  const webhook = await em.findOne(Webhook, { id: params.webhookId });
  if (!webhook) {
    return null;
  }

  // 建立排程
  const schedule = new WebhookSchedule(webhook, params.name);

  // 設定選填欄位
  if (params.messageContent !== undefined) {
    schedule.messageContent = params.messageContent;
  }
  if (params.embedData !== undefined) {
    schedule.embedData = params.embedData;
  }
  if (params.imageUrl !== undefined) {
    schedule.imageUrl = params.imageUrl;
  }
  if (params.scheduleType !== undefined) {
    schedule.scheduleType = params.scheduleType;
  }
  if (params.intervalMinutes !== undefined) {
    schedule.intervalMinutes = params.intervalMinutes;
  }
  if (params.scheduleTime !== undefined) {
    schedule.scheduleTime = params.scheduleTime;
  }
  if (params.scheduleDays !== undefined) {
    schedule.scheduleDays = params.scheduleDays;
  }
  if (params.isActive !== undefined) {
    schedule.isActive = params.isActive;
  }

  // 計算並設定下次觸發時間（重要：沒有此設定，排程不會被觸發）
  schedule.nextTriggerAt = calculateNextTriggerTime(schedule);

  await em.persistAndFlush(schedule);
  return schedule;
}

/**
 * 根據 ID 取得排程
 * @param em EntityManager 實例
 * @param id 排程 ID
 * @returns WebhookSchedule 實體或 null
 */
export async function getWebhookScheduleById(
  em: EntityManager,
  id: string
): Promise<WebhookSchedule | null> {
  try {
    return await em.findOne(WebhookSchedule, { id }, { populate: ["webhook"] });
  } catch {
    return null;
  }
}

/**
 * 取得指定 Webhook 的所有排程
 * @param em EntityManager 實例
 * @param webhookId Webhook ID
 * @returns WebhookSchedule 陣列
 */
export async function getSchedulesByWebhookId(
  em: EntityManager,
  webhookId: string
): Promise<WebhookSchedule[]> {
  return em.find(
    WebhookSchedule,
    { webhook: { id: webhookId } },
    { orderBy: { createdAt: "DESC" } }
  );
}

/**
 * 更新排程
 * @param em EntityManager 實例
 * @param id 排程 ID
 * @param params 更新參數
 * @returns 更新後的 WebhookSchedule 實體或 null
 */
export async function updateWebhookSchedule(
  em: EntityManager,
  id: string,
  params: UpdateWebhookScheduleParams
): Promise<WebhookSchedule | null> {
  const schedule = await getWebhookScheduleById(em, id);
  if (!schedule) {
    return null;
  }

  // 記錄是否有變更排程相關設定
  let scheduleSettingsChanged = false;

  // 只更新有提供的欄位
  if (params.name !== undefined) schedule.name = params.name;
  if (params.messageContent !== undefined)
    schedule.messageContent = params.messageContent;
  if (params.embedData !== undefined) schedule.embedData = params.embedData;
  if (params.imageUrl !== undefined) schedule.imageUrl = params.imageUrl;
  if (params.scheduleType !== undefined) {
    schedule.scheduleType = params.scheduleType;
    scheduleSettingsChanged = true;
  }
  if (params.intervalMinutes !== undefined) {
    schedule.intervalMinutes = params.intervalMinutes;
    scheduleSettingsChanged = true;
  }
  if (params.scheduleTime !== undefined) {
    schedule.scheduleTime = params.scheduleTime;
    scheduleSettingsChanged = true;
  }
  if (params.scheduleDays !== undefined) {
    schedule.scheduleDays = params.scheduleDays;
    scheduleSettingsChanged = true;
  }
  if (params.isActive !== undefined) {
    schedule.isActive = params.isActive;
    // 如果重新啟用排程，也需要重新計算下次觸發時間
    if (params.isActive) {
      scheduleSettingsChanged = true;
    }
  }
  if (params.nextTriggerAt !== undefined) {
    schedule.nextTriggerAt = params.nextTriggerAt;
  }

  // 如果排程設定變更了，重新計算下次觸發時間
  if (scheduleSettingsChanged && schedule.isActive) {
    schedule.nextTriggerAt = calculateNextTriggerTime(schedule);
  }

  await em.flush();
  return schedule;
}

/**
 * 刪除排程
 * @param em EntityManager 實例
 * @param id 排程 ID
 * @returns 是否刪除成功
 */
export async function deleteWebhookSchedule(
  em: EntityManager,
  id: string
): Promise<boolean> {
  const schedule = await getWebhookScheduleById(em, id);
  if (!schedule) {
    return false;
  }

  await em.removeAndFlush(schedule);
  return true;
}

/**
 * 套用樣板到 Webhook（建立新排程）
 * @param em EntityManager 實例
 * @param templateId 樣板 ID
 * @param webhookId Webhook ID
 * @returns 建立的 WebhookSchedule 實體，若樣板或 Webhook 不存在則回傳 null
 */
export async function applyTemplateToWebhook(
  em: EntityManager,
  templateId: string,
  webhookId: string
): Promise<WebhookSchedule | null> {
  // 取得樣板
  const template = await em.findOne(Template, { id: templateId });
  if (!template) {
    return null;
  }

  // 取得 Webhook
  const webhook = await em.findOne(Webhook, { id: webhookId });
  if (!webhook) {
    return null;
  }

  // 複製樣板設定到新排程
  const schedule = new WebhookSchedule(webhook, template.name);
  schedule.messageContent = template.messageContent;
  schedule.embedData = template.embedData;
  schedule.imageUrl = template.imageUrl;
  schedule.scheduleType = template.scheduleType;
  schedule.intervalMinutes = template.intervalMinutes;
  schedule.scheduleTime = template.scheduleTime;
  schedule.scheduleDays = template.scheduleDays;

  // 計算並設定下次觸發時間（重要：沒有此設定，排程不會被觸發）
  schedule.nextTriggerAt = calculateNextTriggerTime(schedule);

  await em.persistAndFlush(schedule);
  return schedule;
}
