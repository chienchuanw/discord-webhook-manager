/**
 * Message Service
 * 處理訊息發送與記錄的邏輯
 */
import { EntityManager } from "@mikro-orm/postgresql";
import { Webhook } from "../db/entities/Webhook";
import { MessageLog, MessageStatus } from "../db/entities/MessageLog";

/* ============================================
   型別定義
   ============================================ */

/**
 * 建立訊息記錄的參數
 */
export interface CreateMessageLogParams {
  webhook: Webhook;
  content: string;
  status: MessageStatus;
  statusCode?: number;
  errorMessage?: string;
  imageUrl?: string; // Discord 回傳的圖片 URL
}

/**
 * 發送訊息的參數
 */
export interface SendMessageParams {
  webhookId: string;
  content: string;
}

/**
 * 發送訊息的結果
 */
export interface SendMessageResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  messageLog?: MessageLog;
}

/**
 * 發送含圖片訊息的參數
 * content 和 file 至少需要一個
 */
export interface SendMessageWithImageParams {
  webhookId: string;
  content?: string; // 文字內容（可選）
  file?: File | Blob; // 圖片檔案（可選）
  fileName?: string; // 檔案名稱（可選，預設為 image.png）
}

/* ============================================
   訊息記錄操作函式
   ============================================ */

/**
 * 建立訊息記錄
 * @param em EntityManager 實例
 * @param params 建立參數
 * @returns 建立的 MessageLog 實體
 */
export async function createMessageLog(
  em: EntityManager,
  params: CreateMessageLogParams
): Promise<MessageLog> {
  const { webhook, content, status, statusCode, errorMessage, imageUrl } =
    params;

  const messageLog = new MessageLog(webhook, content, status);
  if (statusCode !== undefined) {
    messageLog.statusCode = statusCode;
  }
  if (errorMessage) {
    messageLog.errorMessage = errorMessage;
  }
  if (imageUrl) {
    messageLog.imageUrl = imageUrl;
  }

  await em.persistAndFlush(messageLog);
  return messageLog;
}

/**
 * 分頁查詢結果的型別定義
 */
export interface PaginatedMessageLogs {
  messages: MessageLog[];
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * 取得指定 Webhook 的訊息記錄（支援分頁）
 *
 * 使用 cursor-based 分頁方式，以 sentAt 時間戳作為游標
 * 查詢結果按發送時間降序排列（最新的在前）
 *
 * @param em EntityManager 實例
 * @param webhookId Webhook ID
 * @param limit 回傳筆數（預設 20）
 * @param cursor 分頁游標（ISO 格式的時間字串），用於載入更舊的訊息
 * @returns 包含訊息陣列、是否有更多資料、下一頁游標的物件
 */
export async function getMessageLogs(
  em: EntityManager,
  webhookId: string,
  limit: number = 20,
  cursor?: string
): Promise<PaginatedMessageLogs> {
  // 建立查詢條件
  const where: Record<string, unknown> = { webhook: { id: webhookId } };

  // 如果有提供 cursor，查詢比該時間更早的訊息
  if (cursor) {
    where.sentAt = { $lt: new Date(cursor) };
  }

  // 多查一筆用來判斷是否還有更多資料
  const messages = await em.find(MessageLog, where, {
    orderBy: { sentAt: "DESC" },
    limit: limit + 1,
  });

  // 判斷是否有下一頁
  const hasMore = messages.length > limit;

  // 如果有多的那一筆，移除它
  if (hasMore) {
    messages.pop();
  }

  // 計算下一頁的 cursor（使用最後一筆的 sentAt）
  const nextCursor =
    hasMore && messages.length > 0
      ? messages[messages.length - 1].sentAt.toISOString()
      : null;

  return {
    messages,
    hasMore,
    nextCursor,
  };
}

/**
 * 發送訊息到 Discord Webhook
 * @param em EntityManager 實例
 * @param params 發送參數
 * @returns 發送結果
 */
export async function sendMessage(
  em: EntityManager,
  params: SendMessageParams
): Promise<SendMessageResult> {
  const { webhookId, content } = params;

  // 取得 Webhook
  let webhook: Webhook | null;
  try {
    webhook = await em.findOne(Webhook, { id: webhookId });
  } catch {
    return { success: false, error: "Webhook 不存在" };
  }

  if (!webhook) {
    return { success: false, error: "Webhook 不存在" };
  }

  // 檢查 Webhook 是否啟用
  if (!webhook.isActive) {
    return { success: false, error: "Webhook 已停用" };
  }

  // 發送訊息到 Discord
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const statusCode = response.status;
    const isSuccess = response.ok;

    // 建立訊息記錄
    let errorMessage: string | undefined;
    if (!isSuccess) {
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch {
        errorMessage = `HTTP ${statusCode}`;
      }
    }

    const messageLog = await createMessageLog(em, {
      webhook,
      content,
      status: isSuccess ? MessageStatus.SUCCESS : MessageStatus.FAILED,
      statusCode,
      errorMessage,
    });

    // 更新 Webhook 統計資料
    if (isSuccess) {
      webhook.successCount += 1;
      webhook.lastUsed = new Date();
    } else {
      webhook.failCount += 1;
    }
    await em.persistAndFlush(webhook);

    return {
      success: isSuccess,
      statusCode,
      error: errorMessage,
      messageLog,
    };
  } catch (error) {
    // 網路錯誤或其他例外
    const errorMessage = error instanceof Error ? error.message : String(error);

    const messageLog = await createMessageLog(em, {
      webhook,
      content,
      status: MessageStatus.FAILED,
      errorMessage,
    });

    // 更新失敗計數
    webhook.failCount += 1;
    await em.persistAndFlush(webhook);

    return {
      success: false,
      error: errorMessage,
      messageLog,
    };
  }
}

/**
 * 發送含圖片的訊息到 Discord Webhook
 * 使用 FormData 格式發送，支援圖片上傳
 *
 * @param em EntityManager 實例
 * @param params 發送參數（content 和 file 至少需要一個）
 * @returns 發送結果
 */
export async function sendMessageWithImage(
  em: EntityManager,
  params: SendMessageWithImageParams
): Promise<SendMessageResult> {
  const { webhookId, content, file, fileName } = params;

  // 驗證：content 和 file 至少需要一個
  if (!content?.trim() && !file) {
    return { success: false, error: "訊息內容或圖片至少需要一個" };
  }

  // 取得 Webhook
  let webhook: Webhook | null;
  try {
    webhook = await em.findOne(Webhook, { id: webhookId });
  } catch {
    return { success: false, error: "Webhook 不存在" };
  }

  if (!webhook) {
    return { success: false, error: "Webhook 不存在" };
  }

  // 檢查 Webhook 是否啟用
  if (!webhook.isActive) {
    return { success: false, error: "Webhook 已停用" };
  }

  // 建立 FormData
  const formData = new FormData();
  if (content?.trim()) {
    formData.append("content", content.trim());
  }
  if (file) {
    // 使用提供的檔名或預設為 image.png
    formData.append("file", file, fileName || "image.png");
  }

  // 發送訊息到 Discord（使用 FormData，不設定 Content-Type）
  // 加上 ?wait=true 讓 Discord 回傳完整的訊息資料（包含 attachments）
  try {
    const response = await fetch(`${webhook.url}?wait=true`, {
      method: "POST",
      body: formData,
    });

    const statusCode = response.status;
    const isSuccess = response.ok;

    // 解析回應以取得圖片 URL
    let errorMessage: string | undefined;
    let imageUrl: string | undefined;

    if (isSuccess) {
      try {
        // Discord 回傳的 JSON 包含 attachments 陣列
        const responseData = await response.json();
        // 取得第一張圖片的 URL（proxy_url 或 url）
        if (responseData.attachments && responseData.attachments.length > 0) {
          imageUrl =
            responseData.attachments[0].proxy_url ||
            responseData.attachments[0].url;
        }
      } catch {
        // 解析失敗不影響成功狀態
      }
    } else {
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch {
        errorMessage = `HTTP ${statusCode}`;
      }
    }

    // 記錄內容：優先使用文字內容，若無則標記為 [圖片]
    const logContent = content?.trim() || "[圖片]";

    const messageLog = await createMessageLog(em, {
      webhook,
      content: logContent,
      status: isSuccess ? MessageStatus.SUCCESS : MessageStatus.FAILED,
      statusCode,
      errorMessage,
      imageUrl, // 儲存圖片 URL
    });

    // 更新 Webhook 統計資料
    if (isSuccess) {
      webhook.successCount += 1;
      webhook.lastUsed = new Date();
    } else {
      webhook.failCount += 1;
    }
    await em.persistAndFlush(webhook);

    return {
      success: isSuccess,
      statusCode,
      error: errorMessage,
      messageLog,
    };
  } catch (error) {
    // 網路錯誤或其他例外
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logContent = content?.trim() || "[圖片]";

    const messageLog = await createMessageLog(em, {
      webhook,
      content: logContent,
      status: MessageStatus.FAILED,
      errorMessage,
    });

    // 更新失敗計數
    webhook.failCount += 1;
    await em.persistAndFlush(webhook);

    return {
      success: false,
      error: errorMessage,
      messageLog,
    };
  }
}
