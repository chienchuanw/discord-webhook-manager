/**
 * Webhook API Routes
 * 處理 /api/webhooks 的 GET 和 POST 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import {
  getAllWebhooks,
  createWebhook,
  type CreateWebhookParams,
} from "@/services/webhookService";

/**
 * GET /api/webhooks
 * 取得所有 Webhooks
 */
export async function GET() {
  try {
    const em = await getEntityManager();
    const webhooks = await getAllWebhooks(em);

    return NextResponse.json(webhooks, { status: 200 });
  } catch (error) {
    console.error("取得 Webhooks 失敗:", error);
    return NextResponse.json(
      { error: "取得 Webhooks 失敗" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * 建立新的 Webhook
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 驗證必要欄位
    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: "缺少必要欄位：name 和 url 為必填" },
        { status: 400 }
      );
    }

    const params: CreateWebhookParams = {
      name: body.name,
      url: body.url,
      isActive: body.isActive ?? true,
    };

    const em = await getEntityManager();
    const webhook = await createWebhook(em, params);

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error("建立 Webhook 失敗:", error);
    return NextResponse.json(
      { error: "建立 Webhook 失敗" },
      { status: 500 }
    );
  }
}

