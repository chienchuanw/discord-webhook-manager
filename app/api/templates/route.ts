/**
 * Template API Routes
 * 處理 /api/templates 的 GET 和 POST 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import {
  getAllTemplates,
  createTemplate,
  type CreateTemplateParams,
} from "@/services/templateService";
import { ScheduleType } from "@/db/entities/Template";

/**
 * GET /api/templates
 * 取得所有樣板（按建立時間降序排列）
 */
export async function GET() {
  try {
    const em = await getEntityManager();
    const templates = await getAllTemplates(em);

    return NextResponse.json(templates, { status: 200 });
  } catch (error) {
    console.error("取得樣板失敗:", error);
    return NextResponse.json({ error: "取得樣板失敗" }, { status: 500 });
  }
}

/**
 * POST /api/templates
 * 建立新的樣板
 *
 * Request Body:
 * - name: 樣板名稱（必填）
 * - description: 樣板描述（選填）
 * - messageContent: 純文字訊息內容（選填）
 * - embedData: Discord Embed JSON（選填）
 * - imageUrl: 圖片 URL（選填）
 * - scheduleType: 排程類型（interval/daily/weekly，預設 daily）
 * - intervalMinutes: 間隔分鐘數（用於 interval 類型）
 * - scheduleTime: 排程時間（用於 daily/weekly，格式 HH:mm）
 * - scheduleDays: 排程星期（用於 weekly，陣列如 [1,3,5]）
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 驗證必要欄位
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "缺少必要欄位：name 為必填" },
        { status: 400 }
      );
    }

    // 解析 scheduleType（轉換字串為 enum）
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
    const params: CreateTemplateParams = {
      name: body.name.trim(),
    };

    // 設定選填欄位
    if (body.description !== undefined) {
      params.description = body.description;
    }
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

    const em = await getEntityManager();
    const template = await createTemplate(em, params);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("建立樣板失敗:", error);
    return NextResponse.json({ error: "建立樣板失敗" }, { status: 500 });
  }
}

