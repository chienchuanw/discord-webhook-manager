/**
 * 訊息歷史 API 測試
 * TDD: 測試 GET /api/webhooks/[id]/messages 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM } from "@mikro-orm/postgresql";
import config from "../../../../../mikro-orm.config";
import { Webhook } from "../../../../../db/entities/Webhook";
import { MessageLog, MessageStatus } from "../../../../../db/entities/MessageLog";
import { GET } from "./route";

describe("GET /api/webhooks/[id]/messages", () => {
  let orm: MikroORM;
  let testWebhookId: string;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    global.__orm = orm;
  });

  // 每個測試前建立測試資料
  beforeEach(async () => {
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

  it("沒有訊息記錄時應該回傳空陣列", async () => {
    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/messages`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messages).toEqual([]);
  });

  it("應該回傳訊息記錄列表", async () => {
    // 建立測試訊息記錄
    const em = orm.em.fork();
    const webhook = await em.findOne(Webhook, { id: testWebhookId });
    if (webhook) {
      const log1 = new MessageLog(webhook, "訊息 1", MessageStatus.SUCCESS);
      log1.statusCode = 204;
      const log2 = new MessageLog(webhook, "訊息 2", MessageStatus.FAILED);
      log2.statusCode = 400;
      log2.errorMessage = "Bad Request";
      await em.persistAndFlush([log1, log2]);
    }
    em.clear();

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/messages`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messages).toHaveLength(2);
    expect(data.messages[0]).toHaveProperty("id");
    expect(data.messages[0]).toHaveProperty("content");
    expect(data.messages[0]).toHaveProperty("status");
    expect(data.messages[0]).toHaveProperty("sentAt");
  });

  it("應該限制回傳最多 10 筆記錄", async () => {
    const em = orm.em.fork();
    const webhook = await em.findOne(Webhook, { id: testWebhookId });
    if (webhook) {
      const logs = [];
      for (let i = 0; i < 15; i++) {
        const log = new MessageLog(webhook, `訊息 ${i}`, MessageStatus.SUCCESS);
        log.statusCode = 204;
        logs.push(log);
      }
      await em.persistAndFlush(logs);
    }
    em.clear();

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/messages`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messages).toHaveLength(10);
  });

  it("Webhook 不存在應該回傳 404", async () => {
    const request = new Request(
      "http://localhost/api/webhooks/non-existent-id/messages"
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "non-existent-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("找不到指定的 Webhook");
  });

  it("應該按照發送時間降序排列", async () => {
    const em = orm.em.fork();
    const webhook = await em.findOne(Webhook, { id: testWebhookId });
    if (webhook) {
      const log1 = new MessageLog(webhook, "較早的訊息", MessageStatus.SUCCESS);
      log1.statusCode = 204;
      log1.sentAt = new Date("2025-01-01T00:00:00Z");

      const log2 = new MessageLog(webhook, "較新的訊息", MessageStatus.SUCCESS);
      log2.statusCode = 204;
      log2.sentAt = new Date("2025-01-02T00:00:00Z");

      await em.persistAndFlush([log1, log2]);
    }
    em.clear();

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/messages`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messages[0].content).toBe("較新的訊息");
    expect(data.messages[1].content).toBe("較早的訊息");
  });
});

