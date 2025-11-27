/**
 * 預約發送訊息 API
 * POST /api/webhooks/[id]/schedule - 建立預約訊息
 */
import { NextResponse } from "next/server";
import { getORM } from "@/db";
import { createScheduledMessage } from "@/services/scheduleService";

// 定義請求參數型別
interface RouteParams {
  params: Promise<{ id: string }>;
}

// 定義請求 body 型別
interface ScheduleRequestBody {
  content?: string;
  scheduledAt?: string;
}

/**
 * POST /api/webhooks/[id]/schedule
 * 建立預約發送訊息
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: webhookId } = await params;
    const body: ScheduleRequestBody = await request.json();

    // 驗證必要欄位
    if (!body.content || body.content.trim() === "") {
      return NextResponse.json({ error: "訊息內容不能為空" }, { status: 400 });
    }

    if (!body.scheduledAt) {
      return NextResponse.json({ error: "預約時間不能為空" }, { status: 400 });
    }

    // 解析預約時間
    const scheduledAt = new Date(body.scheduledAt);

    // 驗證預約時間是否在未來
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: "預約時間必須在未來" },
        { status: 400 }
      );
    }

    // 取得 ORM 實例
    const orm = await getORM();
    const em = orm.em.fork();

    // 建立預約訊息
    const result = await createScheduledMessage(em, {
      webhookId,
      content: body.content.trim(),
      scheduledAt,
    });

    if (!result.success) {
      // 根據錯誤訊息決定回傳狀態碼
      if (result.error === "Webhook 不存在") {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        messageLog: result.messageLog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("建立預約訊息失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

