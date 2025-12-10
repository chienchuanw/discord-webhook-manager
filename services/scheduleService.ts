/**
 * Schedule Service
 * 處理預約發送訊息的邏輯
 */
import { EntityManager } from "@mikro-orm/sqlite";
import { Webhook } from "../db/entities/Webhook";
import {
  MessageLog,
  MessageStatus,
  ScheduledStatus,
} from "../db/entities/MessageLog";

/* ============================================
   型別定義
   ============================================ */

/**
 * 建立預約訊息的參數
 */
export interface CreateScheduledMessageParams {
  webhookId: string;
  content: string;
  scheduledAt: Date;
}

/**
 * 預約訊息操作的結果
 */
export interface ScheduledMessageResult {
  success: boolean;
  error?: string;
  messageLog?: MessageLog;
}

/**
 * 發送預約訊息的結果
 */
export interface SendScheduledResult {
  success: boolean;
  error?: string;
  messageLogId: string;
}

/* ============================================
   預約訊息操作函式
   ============================================ */

/**
 * 建立預約訊息
 * @param em EntityManager 實例
 * @param params 建立參數
 * @returns 操作結果
 */
export async function createScheduledMessage(
  em: EntityManager,
  params: CreateScheduledMessageParams
): Promise<ScheduledMessageResult> {
  const { webhookId, content, scheduledAt } = params;

  // 檢查預約時間是否在未來
  if (scheduledAt <= new Date()) {
    return { success: false, error: "預約時間必須在未來" };
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

  // 建立預約訊息記錄（使用 PENDING 狀態表示尚未發送）
  const messageLog = new MessageLog(webhook, content, MessageStatus.PENDING);
  messageLog.scheduledAt = scheduledAt;
  messageLog.scheduledStatus = ScheduledStatus.PENDING;
  messageLog.sentAt = new Date(); // 建立時間（之後發送時會更新）

  await em.persistAndFlush(messageLog);

  return { success: true, messageLog };
}

/**
 * 取消預約訊息
 * @param em EntityManager 實例
 * @param messageLogId 訊息記錄 ID
 * @returns 操作結果
 */
export async function cancelScheduledMessage(
  em: EntityManager,
  messageLogId: string
): Promise<ScheduledMessageResult> {
  // 查詢訊息記錄
  let messageLog: MessageLog | null;
  try {
    messageLog = await em.findOne(MessageLog, { id: messageLogId });
  } catch {
    return { success: false, error: "訊息不存在" };
  }

  if (!messageLog) {
    return { success: false, error: "訊息不存在" };
  }

  // 檢查是否為預約訊息
  if (!messageLog.scheduledAt || !messageLog.scheduledStatus) {
    return { success: false, error: "此訊息不是預約訊息" };
  }

  // 檢查是否已發送
  if (messageLog.scheduledStatus === ScheduledStatus.SENT) {
    return { success: false, error: "此訊息已發送，無法取消" };
  }

  // 檢查是否已取消
  if (messageLog.scheduledStatus === ScheduledStatus.CANCELLED) {
    return { success: false, error: "此訊息已取消" };
  }

  // 更新狀態為已取消
  messageLog.scheduledStatus = ScheduledStatus.CANCELLED;
  await em.persistAndFlush(messageLog);

  return { success: true, messageLog };
}

/**
 * 取得到期的待發送預約訊息
 * @param em EntityManager 實例
 * @returns 待發送的訊息記錄陣列
 *
 * 排序邏輯：
 * 1. 先按預約時間 (scheduledAt) 升序排列
 * 2. 相同預約時間時，按建立時間 (sentAt，此時為建立時間) 升序排列
 *    確保先預約的訊息先發送
 */
export async function getPendingScheduledMessages(
  em: EntityManager
): Promise<MessageLog[]> {
  const now = new Date();

  return em.find(
    MessageLog,
    {
      scheduledStatus: ScheduledStatus.PENDING,
      scheduledAt: { $lte: now },
    },
    {
      populate: ["webhook"],
      orderBy: { scheduledAt: "ASC", sentAt: "ASC" },
    }
  );
}

/**
 * 發送所有到期的預約訊息
 * @param em EntityManager 實例
 * @returns 發送結果陣列
 */
export async function sendScheduledMessages(
  em: EntityManager
): Promise<SendScheduledResult[]> {
  const pendingMessages = await getPendingScheduledMessages(em);
  const results: SendScheduledResult[] = [];

  for (const messageLog of pendingMessages) {
    const webhook = messageLog.webhook;

    // 檢查 Webhook 是否仍然啟用
    if (!webhook.isActive) {
      messageLog.scheduledStatus = ScheduledStatus.CANCELLED;
      messageLog.errorMessage = "Webhook 已停用，訊息已取消";
      await em.persistAndFlush(messageLog);

      results.push({
        success: false,
        error: "Webhook 已停用，訊息已取消",
        messageLogId: messageLog.id,
      });
      continue;
    }

    // 發送訊息到 Discord
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageLog.content }),
      });

      const statusCode = response.status;
      const isSuccess = response.ok;

      // 更新訊息記錄
      messageLog.scheduledStatus = ScheduledStatus.SENT;
      messageLog.status = isSuccess
        ? MessageStatus.SUCCESS
        : MessageStatus.FAILED;
      messageLog.statusCode = statusCode;
      messageLog.sentAt = new Date();

      if (!isSuccess) {
        try {
          const errorData = await response.json();
          messageLog.errorMessage = JSON.stringify(errorData);
        } catch {
          messageLog.errorMessage = `HTTP ${statusCode}`;
        }
      }

      // 更新 Webhook 統計
      if (isSuccess) {
        webhook.successCount += 1;
        webhook.lastUsed = new Date();
      } else {
        webhook.failCount += 1;
      }

      await em.persistAndFlush([messageLog, webhook]);

      results.push({
        success: isSuccess,
        error: messageLog.errorMessage,
        messageLogId: messageLog.id,
      });
    } catch (error) {
      // 網路錯誤
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      messageLog.scheduledStatus = ScheduledStatus.SENT;
      messageLog.status = MessageStatus.FAILED;
      messageLog.errorMessage = errorMessage;
      messageLog.sentAt = new Date();

      webhook.failCount += 1;
      await em.persistAndFlush([messageLog, webhook]);

      results.push({
        success: false,
        error: errorMessage,
        messageLogId: messageLog.id,
      });
    }
  }

  return results;
}
