/**
 * Template API Routes
 * 處理 /api/templates/[id] 的 GET, PATCH, DELETE 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  type UpdateTemplateParams,
} from "@/services/templateService";
import { ScheduleType } from "@/db/entities/Template";

// Next.js 15+ 的 params 型別
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/templates/[id]
 * 取得指定的樣板
 */

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const em = await getEntityManager();
    const template = await getTemplateById(em, id);

    if (!template) {
      return NextResponse.json({ error: "找不到指定的樣板" }, { status: 404 });
    }

    return NextResponse.json(template, { status: 200 });
  } catch (error) {
    console.error("取得樣板失敗:", error);
    return NextResponse.json({ error: "取得樣板失敗" }, { status: 500 });
  }
}

/**
 * PATCH /api/templates/[id]
 * 更新指定的樣板
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

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

    // 組裝更新參數
    const params: UpdateTemplateParams = {};
    if (body.name !== undefined) params.name = body.name;
    if (body.description !== undefined) params.description = body.description;
    if (body.messageContent !== undefined)
      params.messageContent = body.messageContent;
    if (body.embedData !== undefined) params.embedData = body.embedData;
    if (body.imageUrl !== undefined) params.imageUrl = body.imageUrl;
    if (scheduleType !== undefined) params.scheduleType = scheduleType;
    if (body.intervalMinutes !== undefined)
      params.intervalMinutes = body.intervalMinutes;
    if (body.scheduleTime !== undefined)
      params.scheduleTime = body.scheduleTime;
    if (body.scheduleDays !== undefined)
      params.scheduleDays = body.scheduleDays;

    const em = await getEntityManager();
    const template = await updateTemplate(em, id, params);

    if (!template) {
      return NextResponse.json({ error: "找不到指定的樣板" }, { status: 404 });
    }

    return NextResponse.json(template, { status: 200 });
  } catch (error) {
    console.error("更新樣板失敗:", error);
    return NextResponse.json({ error: "更新樣板失敗" }, { status: 500 });
  }
}

/**
 * DELETE /api/templates/[id]
 * 刪除指定的樣板
 */

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const em = await getEntityManager();
    const success = await deleteTemplate(em, id);

    if (!success) {
      return NextResponse.json({ error: "找不到指定的樣板" }, { status: 404 });
    }

    // 204 No Content - 成功刪除但不回傳內容
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("刪除樣板失敗:", error);
    return NextResponse.json({ error: "刪除樣板失敗" }, { status: 500 });
  }
}
