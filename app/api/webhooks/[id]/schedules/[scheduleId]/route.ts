/**
 * WebhookSchedule 單一排程 API Routes
 * 處理 /api/webhooks/[id]/schedules/[scheduleId] 的 GET, PATCH, DELETE 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import {
  getWebhookScheduleById,
  updateWebhookSchedule,
  deleteWebhookSchedule,
  type UpdateWebhookScheduleParams,
} from "@/services/webhookScheduleService";
import { ScheduleType } from "@/db/entities/Template";

// Next.js 15+ 動態路由參數型別
type RouteContext = {
  params: Promise<{ id: string; scheduleId: string }>;
};

/**
 * GET /api/webhooks/[id]/schedules/[scheduleId]
 * 取得單一排程
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { scheduleId } = await context.params;
    const em = await getEntityManager();
    const schedule = await getWebhookScheduleById(em, scheduleId);

    if (!schedule) {
      return NextResponse.json({ error: "排程不存在" }, { status: 404 });
    }

    return NextResponse.json(schedule, { status: 200 });
  } catch (error) {
    console.error("取得排程失敗:", error);
    return NextResponse.json({ error: "取得排程失敗" }, { status: 500 });
  }
}

/**
 * PATCH /api/webhooks/[id]/schedules/[scheduleId]
 * 更新排程
 *
 * Request Body (所有欄位皆為選填):
 * - name: 排程名稱
 * - messageContent: 純文字訊息內容
 * - embedData: Discord Embed JSON
 * - imageUrl: 圖片 URL
 * - scheduleType: 排程類型（interval/daily/weekly）
 * - intervalMinutes: 間隔分鐘數
 * - scheduleTime: 排程時間
 * - scheduleDays: 排程星期
 * - isActive: 是否啟用
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { scheduleId } = await context.params;
    const body = await request.json();

    // 解析 scheduleType
    let scheduleType: ScheduleType | undefined;
    if (body.scheduleType) {
      const typeMap: Record<string, ScheduleType> = {
        interval: ScheduleType.INTERVAL,
        daily: ScheduleType.DAILY,
        weekly: ScheduleType.WEEKLY,
      };
      scheduleType = typeMap[body.scheduleType];
    }

    // 組裝更新參數
    const params: UpdateWebhookScheduleParams = {};

    if (body.name !== undefined) params.name = body.name;
    if (body.messageContent !== undefined)
      params.messageContent = body.messageContent;
    if (body.embedData !== undefined) params.embedData = body.embedData;
    if (body.imageUrl !== undefined) params.imageUrl = body.imageUrl;
    if (scheduleType !== undefined) params.scheduleType = scheduleType;
    if (body.intervalMinutes !== undefined)
      params.intervalMinutes = body.intervalMinutes;
    if (body.scheduleTime !== undefined) params.scheduleTime = body.scheduleTime;
    if (body.scheduleDays !== undefined) params.scheduleDays = body.scheduleDays;
    if (body.isActive !== undefined) params.isActive = body.isActive;

    const em = await getEntityManager();
    const schedule = await updateWebhookSchedule(em, scheduleId, params);

    if (!schedule) {
      return NextResponse.json({ error: "排程不存在" }, { status: 404 });
    }

    return NextResponse.json(schedule, { status: 200 });
  } catch (error) {
    console.error("更新排程失敗:", error);
    return NextResponse.json({ error: "更新排程失敗" }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks/[id]/schedules/[scheduleId]
 * 刪除排程
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { scheduleId } = await context.params;
    const em = await getEntityManager();
    const success = await deleteWebhookSchedule(em, scheduleId);

    if (!success) {
      return NextResponse.json({ error: "排程不存在" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("刪除排程失敗:", error);
    return NextResponse.json({ error: "刪除排程失敗" }, { status: 500 });
  }
}

