/**
 * Webhook API Routes
 * 處理 /api/webhooks/[id] 的 GET, PATCH, DELETE 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import {
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  type UpdateWebhookParams,
} from "@/services/webhookService";

// Next.js 15+ 的 params 型別
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/webhooks/[id]
 * 取得指定的 Webhook
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const em = await getEntityManager();
    const webhook = await getWebhookById(em, id);

    if (!webhook) {
      return NextResponse.json(
        { error: "找不到指定的 Webhook" },
        { status: 404 }
      );
    }

    return NextResponse.json(webhook, { status: 200 });
  } catch (error) {
    console.error("取得 Webhook 失敗:", error);
    return NextResponse.json(
      { error: "取得 Webhook 失敗" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks/[id]
 * 更新指定的 Webhook
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const params: UpdateWebhookParams = {};
    if (body.name !== undefined) params.name = body.name;
    if (body.url !== undefined) params.url = body.url;
    if (body.isActive !== undefined) params.isActive = body.isActive;

    const em = await getEntityManager();
    const webhook = await updateWebhook(em, id, params);

    if (!webhook) {
      return NextResponse.json(
        { error: "找不到指定的 Webhook" },
        { status: 404 }
      );
    }

    return NextResponse.json(webhook, { status: 200 });
  } catch (error) {
    console.error("更新 Webhook 失敗:", error);
    return NextResponse.json(
      { error: "更新 Webhook 失敗" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/[id]
 * 刪除指定的 Webhook
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const em = await getEntityManager();
    const success = await deleteWebhook(em, id);

    if (!success) {
      return NextResponse.json(
        { error: "找不到指定的 Webhook" },
        { status: 404 }
      );
    }

    // 204 No Content - 成功刪除但不回傳內容
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("刪除 Webhook 失敗:", error);
    return NextResponse.json(
      { error: "刪除 Webhook 失敗" },
      { status: 500 }
    );
  }
}

