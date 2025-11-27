/**
 * 取消預約訊息 API
 * DELETE /api/messages/[id]/cancel - 取消預約訊息
 */
import { NextResponse } from "next/server";
import { getORM } from "@/db";
import { cancelScheduledMessage } from "@/services/scheduleService";

// 定義請求參數型別
interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/messages/[id]/cancel
 * 取消預約發送訊息
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id: messageLogId } = await params;

    // 取得 ORM 實例
    const orm = await getORM();
    const em = orm.em.fork();

    // 取消預約訊息
    const result = await cancelScheduledMessage(em, messageLogId);

    if (!result.success) {
      // 根據錯誤訊息決定回傳狀態碼
      if (result.error === "訊息不存在") {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      messageLog: result.messageLog,
    });
  } catch (error) {
    console.error("取消預約訊息失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

