/**
 * Webhook 測試發送 API
 * 處理 POST /api/webhooks/[id]/test 請求
 */
import { NextResponse } from "next/server";
import { getEntityManager } from "@/db";
import { getWebhookById, updateWebhook } from "@/services/webhookService";

// Next.js 15+ 的 params 型別
type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/webhooks/[id]/test
 * 發送測試訊息到 Discord Webhook
 */
export async function POST(request: Request, context: RouteContext) {
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

    // 建立測試訊息
    const testMessage = {
      content: "🧪 **測試訊息**",
      embeds: [
        {
          title: "Discord Webhook Manager",
          description: "這是一則來自 Webhook Manager 的測試訊息。",
          color: 5793266, // Discord 藍色 #5865F2
          fields: [
            {
              name: "Webhook 名稱",
              value: webhook.name,
              inline: true,
            },
            {
              name: "發送時間",
              value: new Date().toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
              }),
              inline: true,
            },
          ],
          footer: {
            text: "Discord Webhook Manager",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // 發送到 Discord
    const discordResponse = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testMessage),
    });

    // 更新統計資料
    const em2 = await getEntityManager();
    if (discordResponse.ok) {
      // 成功：增加成功次數，更新最後使用時間
      await updateWebhook(em2, id, {
        successCount: webhook.successCount + 1,
        lastUsed: new Date(),
      });

      return NextResponse.json(
        { success: true, message: "測試訊息發送成功！" },
        { status: 200 }
      );
    } else {
      // 失敗：增加失敗次數
      await updateWebhook(em2, id, {
        failCount: webhook.failCount + 1,
      });

      const errorText = await discordResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: "Discord 回傳錯誤",
          details: errorText,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("測試發送失敗:", error);
    return NextResponse.json(
      { error: "測試發送失敗" },
      { status: 500 }
    );
  }
}

