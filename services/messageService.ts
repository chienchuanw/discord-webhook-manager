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
  const { webhook, content, status, statusCode, errorMessage } = params;

  const messageLog = new MessageLog(webhook, content, status);
  if (statusCode !== undefined) {
    messageLog.statusCode = statusCode;
  }
  if (errorMessage) {
    messageLog.errorMessage = errorMessage;
  }

  await em.persistAndFlush(messageLog);
  return messageLog;
}

/**
 * 取得指定 Webhook 的訊息記錄
 * @param em EntityManager 實例
 * @param webhookId Webhook ID
 * @param limit 回傳筆數（預設 10）
 * @returns MessageLog 陣列，按發送時間降序排列
 */
export async function getMessageLogs(
  em: EntityManager,
  webhookId: string,
  limit: number = 10
): Promise<MessageLog[]> {
  return em.find(
    MessageLog,
    { webhook: { id: webhookId } },
    {
      orderBy: { sentAt: "DESC" },
      limit,
    }
  );
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

