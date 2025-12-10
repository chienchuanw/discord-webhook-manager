/**
 * Template Service
 * 處理樣板的 CRUD 操作
 */
import { EntityManager } from "@mikro-orm/sqlite";
import {
  Template,
  ScheduleType,
  type EmbedData,
} from "../db/entities/Template";

/* ============================================
   型別定義
   ============================================ */

/**
 * 建立樣板的參數
 */
export interface CreateTemplateParams {
  name: string;
  description?: string;
  messageContent?: string;
  embedData?: EmbedData;
  imageUrl?: string;
  scheduleType?: ScheduleType;
  intervalMinutes?: number;
  scheduleTime?: string;
  scheduleDays?: number[];
}

/**
 * 更新樣板的參數
 */
export interface UpdateTemplateParams {
  name?: string;
  description?: string;
  messageContent?: string;
  embedData?: EmbedData;
  imageUrl?: string;
  scheduleType?: ScheduleType;
  intervalMinutes?: number;
  scheduleTime?: string;
  scheduleDays?: number[];
}

/* ============================================
   CRUD 操作函式
   ============================================ */

/**
 * 建立新的樣板
 * @param em EntityManager 實例
 * @param params 建立參數
 * @returns 建立的 Template 實體
 */
export async function createTemplate(
  em: EntityManager,
  params: CreateTemplateParams
): Promise<Template> {
  const {
    name,
    description,
    messageContent,
    embedData,
    imageUrl,
    scheduleType = ScheduleType.DAILY,
    intervalMinutes,
    scheduleTime,
    scheduleDays,
  } = params;

  // 建立 Template 實體
  const template = new Template(name);

  // 設定選填欄位
  if (description !== undefined) {
    template.description = description;
  }
  if (messageContent !== undefined) {
    template.messageContent = messageContent;
  }
  if (embedData !== undefined) {
    template.embedData = embedData;
  }
  if (imageUrl !== undefined) {
    template.imageUrl = imageUrl;
  }

  // 設定排程相關欄位
  template.scheduleType = scheduleType;
  if (intervalMinutes !== undefined) {
    template.intervalMinutes = intervalMinutes;
  }
  if (scheduleTime !== undefined) {
    template.scheduleTime = scheduleTime;
  }
  if (scheduleDays !== undefined) {
    template.scheduleDays = scheduleDays;
  }

  await em.persistAndFlush(template);
  return template;
}

/**
 * 根據 ID 取得樣板
 * @param em EntityManager 實例
 * @param id 樣板 ID
 * @returns Template 實體或 null（如果不存在）
 */
export async function getTemplateById(
  em: EntityManager,
  id: string
): Promise<Template | null> {
  try {
    return await em.findOne(Template, { id });
  } catch {
    // UUID 格式錯誤時會拋出例外
    return null;
  }
}

/**
 * 取得所有樣板
 * @param em EntityManager 實例
 * @returns Template 陣列（按建立時間降序排列）
 */
export async function getAllTemplates(em: EntityManager): Promise<Template[]> {
  return em.findAll(Template, {
    orderBy: { createdAt: "DESC" },
  });
}

/**
 * 更新樣板
 * @param em EntityManager 實例
 * @param id 樣板 ID
 * @param params 更新參數
 * @returns 更新後的 Template 實體或 null（如果不存在）
 */
export async function updateTemplate(
  em: EntityManager,
  id: string,
  params: UpdateTemplateParams
): Promise<Template | null> {
  const template = await getTemplateById(em, id);
  if (!template) {
    return null;
  }

  // 只更新有提供的欄位
  if (params.name !== undefined) {
    template.name = params.name;
  }
  if (params.description !== undefined) {
    template.description = params.description;
  }
  if (params.messageContent !== undefined) {
    template.messageContent = params.messageContent;
  }
  if (params.embedData !== undefined) {
    template.embedData = params.embedData;
  }
  if (params.imageUrl !== undefined) {
    template.imageUrl = params.imageUrl;
  }
  if (params.scheduleType !== undefined) {
    template.scheduleType = params.scheduleType;
  }
  if (params.intervalMinutes !== undefined) {
    template.intervalMinutes = params.intervalMinutes;
  }
  if (params.scheduleTime !== undefined) {
    template.scheduleTime = params.scheduleTime;
  }
  if (params.scheduleDays !== undefined) {
    template.scheduleDays = params.scheduleDays;
  }

  await em.flush();
  return template;
}

/**
 * 刪除樣板
 * @param em EntityManager 實例
 * @param id 樣板 ID
 * @returns 是否刪除成功
 */
export async function deleteTemplate(
  em: EntityManager,
  id: string
): Promise<boolean> {
  const template = await getTemplateById(em, id);
  if (!template) {
    return false;
  }

  await em.removeAndFlush(template);
  return true;
}
