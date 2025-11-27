/**
 * 訊息歷史 API
 * 處理 GET /api/webhooks/[id]/messages 請求
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
 * 取得指定 Webhook 的訊息發送歷史（最近 10 筆）
 *
 * Response:
 * - messages: 訊息記錄陣列
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const em = await getEntityManager();

    // 先確認 Webhook 存在
    const webhook = await getWebhookById(em, id);
    if (!webhook) {
      return NextResponse.json(
        { error: "找不到指定的 Webhook" },
        { status: 404 }
      );
    }

    // 取得訊息記錄（預設 10 筆）
    const logs = await getMessageLogs(em, id, 10);

    // 格式化回傳資料
    const messages = logs.map((log) => ({
      id: log.id,
      content: log.content,
      status: log.status,
      statusCode: log.statusCode,
      errorMessage: log.errorMessage,
      sentAt: log.sentAt,
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("取得訊息歷史失敗:", error);
    return NextResponse.json(
      { error: "取得訊息歷史失敗" },
      { status: 500 }
    );
  }
}

