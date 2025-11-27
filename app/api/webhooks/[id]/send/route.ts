/**
 * 發送訊息 API
 * 處理 POST /api/webhooks/[id]/send 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import { sendMessage } from "@/services/messageService";

// Next.js 15+ 的 params 型別
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/webhooks/[id]/send
 * 發送訊息到指定的 Discord Webhook
 *
 * Request Body:
 * - content: 訊息內容 (必填)
 *
 * Response:
 * - 成功: { success: true, statusCode, messageLog }
 * - 失敗: { success: false, error, messageLog? }
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // 驗證必要欄位
    if (!body.content || typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json(
        { error: "訊息內容不能為空" },
        { status: 400 }
      );
    }

    const em = await getEntityManager();
    const result = await sendMessage(em, {
      webhookId: id,
      content: body.content.trim(),
    });

    // 根據結果回傳適當的狀態碼
    if (result.error === "Webhook 不存在") {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    if (result.error === "Webhook 已停用") {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // 回傳發送結果（包含成功和失敗的情況）
    return NextResponse.json(
      {
        success: result.success,
        statusCode: result.statusCode,
        error: result.error,
        messageLog: result.messageLog
          ? {
              id: result.messageLog.id,
              content: result.messageLog.content,
              status: result.messageLog.status,
              statusCode: result.messageLog.statusCode,
              errorMessage: result.messageLog.errorMessage,
              sentAt: result.messageLog.sentAt,
            }
          : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("發送訊息失敗:", error);
    return NextResponse.json(
      { error: "發送訊息失敗" },
      { status: 500 }
    );
  }
}

