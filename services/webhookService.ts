/**
 * Webhook Service
 * 處理 Webhook 的 CRUD 操作
 */
import { EntityManager } from "@mikro-orm/sqlite";
import { Webhook } from "../db/entities/Webhook";

/* ============================================
   型別定義
   ============================================ */

/**
 * 建立 Webhook 的參數
 */
export interface CreateWebhookParams {
  name: string;
  url: string;
  isActive?: boolean;
}

/**
 * 更新 Webhook 的參數
 */
export interface UpdateWebhookParams {
  name?: string;
  url?: string;
  isActive?: boolean;
  successCount?: number;
  failCount?: number;
  lastUsed?: Date;
}

/* ============================================
   CRUD 操作函式
   ============================================ */

/**
 * 建立新的 Webhook
 * @param em EntityManager 實例
 * @param params 建立參數
 * @returns 建立的 Webhook 實體
 */
export async function createWebhook(
  em: EntityManager,
  params: CreateWebhookParams
): Promise<Webhook> {
  const { name, url, isActive = true } = params;

  const webhook = new Webhook(name, url);
  webhook.isActive = isActive;

  await em.persistAndFlush(webhook);
  return webhook;
}

/**
 * 根據 ID 取得 Webhook
 * @param em EntityManager 實例
 * @param id Webhook ID
 * @returns Webhook 實體或 null（如果不存在）
 */
export async function getWebhookById(
  em: EntityManager,
  id: string
): Promise<Webhook | null> {
  try {
    return await em.findOne(Webhook, { id });
  } catch {
    // UUID 格式錯誤時會拋出例外
    return null;
  }
}

/**
 * 取得所有 Webhooks
 * @param em EntityManager 實例
 * @returns Webhook 陣列
 */
export async function getAllWebhooks(em: EntityManager): Promise<Webhook[]> {
  return em.findAll(Webhook, {
    orderBy: { createdAt: "DESC" },
  });
}

/**
 * 更新 Webhook
 * @param em EntityManager 實例
 * @param id Webhook ID
 * @param params 更新參數
 * @returns 更新後的 Webhook 實體或 null（如果不存在）
 */
export async function updateWebhook(
  em: EntityManager,
  id: string,
  params: UpdateWebhookParams
): Promise<Webhook | null> {
  const webhook = await getWebhookById(em, id);
  if (!webhook) {
    return null;
  }

  // 只更新有提供的欄位
  if (params.name !== undefined) {
    webhook.name = params.name;
  }
  if (params.url !== undefined) {
    webhook.url = params.url;
  }
  if (params.isActive !== undefined) {
    webhook.isActive = params.isActive;
  }
  if (params.successCount !== undefined) {
    webhook.successCount = params.successCount;
  }
  if (params.failCount !== undefined) {
    webhook.failCount = params.failCount;
  }
  if (params.lastUsed !== undefined) {
    webhook.lastUsed = params.lastUsed;
  }

  await em.flush();
  return webhook;
}

/**
 * 刪除 Webhook
 * @param em EntityManager 實例
 * @param id Webhook ID
 * @returns 是否刪除成功
 */
export async function deleteWebhook(
  em: EntityManager,
  id: string
): Promise<boolean> {
  const webhook = await getWebhookById(em, id);
  if (!webhook) {
    return false;
  }

  await em.removeAndFlush(webhook);
  return true;
}
