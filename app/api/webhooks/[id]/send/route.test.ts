/**
 * 發送訊息 API 測試
 * TDD: 測試 POST /api/webhooks/[id]/send 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MikroORM } from "@mikro-orm/postgresql";
import config from "../../../../../mikro-orm.config";
import { Webhook } from "../../../../../db/entities/Webhook";
import { MessageLog } from "../../../../../db/entities/MessageLog";
import { POST } from "./route";

describe("POST /api/webhooks/[id]/send", () => {
  let orm: MikroORM;
  let testWebhookId: string;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    global.__orm = orm;
  });

  // 每個測試前建立測試資料
  beforeEach(async () => {
    vi.restoreAllMocks();

    const em = orm.em.fork();
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(Webhook, {});

    const testWebhook = new Webhook(
      "測試 Webhook",
      "https://discord.com/api/webhooks/test/test"
    );
    await em.persistAndFlush(testWebhook);
    testWebhookId = testWebhook.id;
    em.clear();
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
    global.__orm = undefined;
  });

  it("成功發送訊息應該回傳 200 和訊息記錄", async () => {
    // Mock fetch 成功
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 204 })
    );

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "測試訊息內容" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.messageLog).toBeDefined();
    expect(data.messageLog.content).toBe("測試訊息內容");
    expect(data.messageLog.status).toBe("success");
  });

  it("發送失敗應該回傳 200 但 success 為 false", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid Webhook" }), {
        status: 400,
      })
    );

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "測試訊息" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.messageLog.status).toBe("failed");
  });

  it("Webhook 不存在應該回傳 404", async () => {
    const request = new Request(
      "http://localhost/api/webhooks/non-existent-id/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "測試" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "non-existent-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Webhook 不存在");
  });

  it("沒有提供 content 應該回傳 400", async () => {
    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("訊息內容不能為空");
  });

  it("Webhook 已停用應該回傳 400", async () => {
    // 將 Webhook 設為停用
    const em = orm.em.fork();
    const webhook = await em.findOne(Webhook, { id: testWebhookId });
    if (webhook) {
      webhook.isActive = false;
      await em.persistAndFlush(webhook);
    }
    em.clear();

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "測試" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Webhook 已停用");
  });
});

