/**
 * 發送含圖片訊息 API
 * POST /api/webhooks/[id]/send-with-image
 *
 * 接收 multipart/form-data 格式的請求，發送訊息（可含圖片）到 Discord Webhook
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import { sendMessageWithImage } from "@/services/messageService";

/** Route Context 型別 */
interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/webhooks/[id]/send-with-image
 * 發送含圖片訊息到指定的 Discord Webhook
 *
 * Request Body (FormData):
 * - content: 訊息內容 (選填)
 * - file: 圖片檔案 (選填)
 * - content 和 file 至少需要一個
 *
 * Response:
 * - 成功: { success: true, statusCode, messageLog }
 * - 失敗: { success: false, error, messageLog? }
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 解析 FormData
    const formData = await request.formData();
    const content = formData.get("content") as string | null;
    const file = formData.get("file") as File | null;

    // 取得 EntityManager
    const em = await getEntityManager();

    // 發送訊息
    const result = await sendMessageWithImage(em, {
      webhookId: id,
      content: content || undefined,
      file: file || undefined,
      fileName: file?.name,
    });

    // 根據結果回傳對應的 HTTP 狀態碼
    if (!result.success) {
      // 判斷錯誤類型並回傳對應狀態碼
      if (result.error === "Webhook 不存在") {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      if (
        result.error === "Webhook 已停用" ||
        result.error === "訊息內容或圖片至少需要一個"
      ) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    // 回傳結果（包含訊息記錄）
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
    console.error("發送圖片訊息失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

