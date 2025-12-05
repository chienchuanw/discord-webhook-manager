/**
 * 套用樣板 API Route
 * 處理 /api/webhooks/[id]/schedules/apply 的 POST 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import { applyTemplateToWebhook } from "@/services/webhookScheduleService";

// Next.js 15+ 動態路由參數型別
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/webhooks/[id]/schedules/apply
 * 套用樣板到 Webhook，建立新排程
 *
 * Request Body:
 * - templateId: 樣板 ID（必填）
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: webhookId } = await context.params;
    const body = await request.json();

    // 驗證必要欄位
    if (!body.templateId || typeof body.templateId !== "string") {
      return NextResponse.json(
        { error: "缺少必要欄位：templateId 為必填" },
        { status: 400 }
      );
    }

    const em = await getEntityManager();
    const schedule = await applyTemplateToWebhook(
      em,
      body.templateId,
      webhookId
    );

    if (!schedule) {
      return NextResponse.json(
        { error: "樣板或 Webhook 不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("套用樣板失敗:", error);
    return NextResponse.json({ error: "套用樣板失敗" }, { status: 500 });
  }
}

