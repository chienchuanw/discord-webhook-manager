/**
 * 取消預約訊息 API 測試
 * TDD: 測試 DELETE /api/messages/[id]/cancel 端點
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
import {
  MessageLog,
  MessageStatus,
  ScheduledStatus,
} from "../../../../../db/entities/MessageLog";
import { DELETE } from "./route";

describe("DELETE /api/messages/[id]/cancel", () => {
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

  it("成功取消預約訊息應該回傳 200", async () => {
    // 建立一個預約訊息
    const em = orm.em.fork();
    const webhook = await em.findOneOrFail(Webhook, { id: testWebhookId });
    const messageLog = em.create(MessageLog, {
      webhook,
      content: "待取消的預約訊息",
      status: MessageStatus.SUCCESS,
      sentAt: new Date(),
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
      scheduledStatus: ScheduledStatus.PENDING,
    });
    await em.persistAndFlush(messageLog);
    const messageLogId = messageLog.id;
    em.clear();

    const request = new Request(
      `http://localhost/api/messages/${messageLogId}/cancel`,
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: messageLogId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.messageLog.scheduledStatus).toBe(ScheduledStatus.CANCELLED);
  });

  it("訊息不存在應該回傳 404", async () => {
    const request = new Request(
      "http://localhost/api/messages/non-existent-id/cancel",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "non-existent-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("訊息不存在");
  });

  it("非預約訊息不能取消應該回傳 400", async () => {
    // 建立一個一般訊息（非預約）
    const em = orm.em.fork();
    const webhook = await em.findOneOrFail(Webhook, { id: testWebhookId });
    const messageLog = em.create(MessageLog, {
      webhook,
      content: "一般訊息",
      status: MessageStatus.SUCCESS,
      sentAt: new Date(),
    });
    await em.persistAndFlush(messageLog);
    const messageLogId = messageLog.id;
    em.clear();

    const request = new Request(
      `http://localhost/api/messages/${messageLogId}/cancel`,
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: messageLogId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("此訊息不是預約訊息");
  });

  it("已發送的預約訊息不能取消應該回傳 400", async () => {
    // 建立一個已發送的預約訊息
    const em = orm.em.fork();
    const webhook = await em.findOneOrFail(Webhook, { id: testWebhookId });
    const messageLog = em.create(MessageLog, {
      webhook,
      content: "已發送的預約訊息",
      status: MessageStatus.SUCCESS,
      sentAt: new Date(),
      scheduledAt: new Date(Date.now() - 60 * 60 * 1000),
      scheduledStatus: ScheduledStatus.SENT,
    });
    await em.persistAndFlush(messageLog);
    const messageLogId = messageLog.id;
    em.clear();

    const request = new Request(
      `http://localhost/api/messages/${messageLogId}/cancel`,
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: messageLogId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("此訊息已發送，無法取消");
  });
});
