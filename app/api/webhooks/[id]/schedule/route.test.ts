/**
 * 預約發送訊息 API 測試
 * TDD: 測試 POST /api/webhooks/[id]/schedule 端點
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { MikroORM } from "@mikro-orm/postgresql";
import config from "../../../../../mikro-orm.config";
import { Webhook } from "../../../../../db/entities/Webhook";
import { MessageLog, ScheduledStatus } from "../../../../../db/entities/MessageLog";
import { POST } from "./route";

describe("POST /api/webhooks/[id]/schedule", () => {
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

  it("成功建立預約訊息應該回傳 201 和訊息記錄", async () => {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000); // 1 小時後

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/schedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "預約測試訊息",
          scheduledAt: scheduledAt.toISOString(),
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.messageLog).toBeDefined();
    expect(data.messageLog.content).toBe("預約測試訊息");
    expect(data.messageLog.scheduledStatus).toBe(ScheduledStatus.PENDING);
    expect(data.messageLog.scheduledAt).toBeDefined();
  });

  it("Webhook 不存在應該回傳 404", async () => {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);

    const request = new Request(
      "http://localhost/api/webhooks/non-existent-id/schedule",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "測試",
          scheduledAt: scheduledAt.toISOString(),
        }),
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
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/schedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: scheduledAt.toISOString() }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("訊息內容不能為空");
  });

  it("沒有提供 scheduledAt 應該回傳 400", async () => {
    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/schedule`,
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

    expect(response.status).toBe(400);
    expect(data.error).toBe("預約時間不能為空");
  });

  it("預約時間在過去應該回傳 400", async () => {
    const pastTime = new Date(Date.now() - 60 * 60 * 1000); // 1 小時前

    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/schedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "測試訊息",
          scheduledAt: pastTime.toISOString(),
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("預約時間必須在未來");
  });
});

