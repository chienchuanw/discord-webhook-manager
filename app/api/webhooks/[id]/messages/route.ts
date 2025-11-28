/**
 * 訊息歷史 API
 * 處理 GET /api/webhooks/[id]/messages 請求
 * 支援 cursor-based 分頁
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import { getWebhookById } from "@/services/webhookService";
import { getMessageLogs } from "@/services/messageService";

// Next.js 15+ 的 params 型別
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/webhooks/[id]/messages
 * 取得指定 Webhook 的訊息發送歷史（支援分頁）
 *
 * Query Parameters:
 * - limit: 每頁筆數（預設 20，最大 100）
 * - cursor: 分頁游標（ISO 時間字串），用於載入更舊的訊息
 *
 * Response:
 * - messages: 訊息記錄陣列
 * - hasMore: 是否還有更多資料
 * - nextCursor: 下一頁的游標
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const em = await getEntityManager();

    // 解析查詢參數
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor") || undefined;

    // 限制每頁筆數在 1-100 之間
    let limit = limitParam ? parseInt(limitParam, 10) : 20;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    // 先確認 Webhook 存在
    const webhook = await getWebhookById(em, id);
    if (!webhook) {
      return NextResponse.json(
        { error: "找不到指定的 Webhook" },
        { status: 404 }
      );
    }

    // 取得訊息記錄（支援分頁）
    const result = await getMessageLogs(em, id, limit, cursor);

    // 格式化回傳資料（包含預約發送相關欄位）
    const messages = result.messages.map((log) => ({
      id: log.id,
      content: log.content,
      status: log.status,
      statusCode: log.statusCode,
      errorMessage: log.errorMessage,
      sentAt: log.sentAt,
      scheduledAt: log.scheduledAt,
      scheduledStatus: log.scheduledStatus,
    }));

    return NextResponse.json(
      {
        messages,
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("取得訊息歷史失敗:", error);
    return NextResponse.json({ error: "取得訊息歷史失敗" }, { status: 500 });
  }
}
