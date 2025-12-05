/**
 * WebhookSchedule API Routes
 * 處理 /api/webhooks/[id]/schedules 的 GET 和 POST 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import {
  getSchedulesByWebhookId,
  createWebhookSchedule,
  type CreateWebhookScheduleParams,
} from "@/services/webhookScheduleService";
import { ScheduleType } from "@/db/entities/Template";

// Next.js 15+ 動態路由參數型別
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/webhooks/[id]/schedules
 * 取得指定 Webhook 的所有排程
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: webhookId } = await context.params;
    const em = await getEntityManager();
    const schedules = await getSchedulesByWebhookId(em, webhookId);

    return NextResponse.json(schedules, { status: 200 });
  } catch (error) {
    console.error("取得排程失敗:", error);
    return NextResponse.json({ error: "取得排程失敗" }, { status: 500 });
  }
}

/**
 * POST /api/webhooks/[id]/schedules
 * 建立新的排程
 *
 * Request Body:
 * - name: 排程名稱（必填）
 * - messageContent: 純文字訊息內容（選填）
 * - embedData: Discord Embed JSON（選填）
 * - imageUrl: 圖片 URL（選填）
 * - scheduleType: 排程類型（interval/daily/weekly）
 * - intervalMinutes: 間隔分鐘數（用於 interval 類型）
 * - scheduleTime: 排程時間（用於 daily/weekly，格式 HH:mm）
 * - scheduleDays: 排程星期（用於 weekly，陣列如 [1,3,5]）
 * - isActive: 是否啟用（預設 true）
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: webhookId } = await context.params;
    const body = await request.json();

    // 驗證必要欄位
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "缺少必要欄位：name 為必填" },
        { status: 400 }
      );
    }

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

    // 組裝建立參數
    const params: CreateWebhookScheduleParams = {
      webhookId,
      name: body.name.trim(),
    };

    // 設定選填欄位
    if (body.messageContent !== undefined) {
      params.messageContent = body.messageContent;
    }
    if (body.embedData !== undefined) {
      params.embedData = body.embedData;
    }
    if (body.imageUrl !== undefined) {
      params.imageUrl = body.imageUrl;
    }
    if (scheduleType !== undefined) {
      params.scheduleType = scheduleType;
    }
    if (body.intervalMinutes !== undefined) {
      params.intervalMinutes = body.intervalMinutes;
    }
    if (body.scheduleTime !== undefined) {
      params.scheduleTime = body.scheduleTime;
    }
    if (body.scheduleDays !== undefined) {
      params.scheduleDays = body.scheduleDays;
    }
    if (body.isActive !== undefined) {
      params.isActive = body.isActive;
    }

    const em = await getEntityManager();
    const schedule = await createWebhookSchedule(em, params);

    if (!schedule) {
      return NextResponse.json(
        { error: "Webhook 不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("建立排程失敗:", error);
    return NextResponse.json({ error: "建立排程失敗" }, { status: 500 });
  }
}

