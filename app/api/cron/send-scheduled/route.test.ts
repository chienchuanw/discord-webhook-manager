/**
 * Cron Job API 測試
 * TDD: 測試 GET /api/cron/send-scheduled 端點
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
import config from "../../../../mikro-orm.config";
import { Webhook } from "../../../../db/entities/Webhook";
import {
  MessageLog,
  MessageStatus,
  ScheduledStatus,
} from "../../../../db/entities/MessageLog";
import { GET } from "./route";

describe("GET /api/cron/send-scheduled", () => {
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

  it("沒有待發送的預約訊息時應該回傳空結果", async () => {
    const request = new Request("http://localhost/api/cron/send-scheduled", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processed).toBe(0);
    expect(data.results).toEqual([]);
  });

  it("應該發送到期的預約訊息", async () => {
    // Mock fetch 成功
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 204 })
    );

    // 建立一個已到期的預約訊息
    const em = orm.em.fork();
    const webhook = await em.findOneOrFail(Webhook, { id: testWebhookId });
    const messageLog = em.create(MessageLog, {
      webhook,
      content: "已到期的預約訊息",
      status: MessageStatus.SUCCESS,
      sentAt: new Date(),
      scheduledAt: new Date(Date.now() - 60 * 1000), // 1 分鐘前
      scheduledStatus: ScheduledStatus.PENDING,
    });
    await em.persistAndFlush(messageLog);
    em.clear();

    const request = new Request("http://localhost/api/cron/send-scheduled", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processed).toBe(1);
    expect(data.results[0].success).toBe(true);
  });

  it("發送失敗時應該記錄錯誤", async () => {
    // Mock fetch 失敗
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid Webhook" }), {
        status: 400,
      })
    );

    // 建立一個已到期的預約訊息
    const em = orm.em.fork();
    const webhook = await em.findOneOrFail(Webhook, { id: testWebhookId });
    const messageLog = em.create(MessageLog, {
      webhook,
      content: "會失敗的預約訊息",
      status: MessageStatus.SUCCESS,
      sentAt: new Date(),
      scheduledAt: new Date(Date.now() - 60 * 1000),
      scheduledStatus: ScheduledStatus.PENDING,
    });
    await em.persistAndFlush(messageLog);
    em.clear();

    const request = new Request("http://localhost/api/cron/send-scheduled", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processed).toBe(1);
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBeDefined();
  });

  it("不應該發送未到期的預約訊息", async () => {
    // 建立一個未到期的預約訊息
    const em = orm.em.fork();
    const webhook = await em.findOneOrFail(Webhook, { id: testWebhookId });
    const messageLog = em.create(MessageLog, {
      webhook,
      content: "未到期的預約訊息",
      status: MessageStatus.SUCCESS,
      sentAt: new Date(),
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 小時後
      scheduledStatus: ScheduledStatus.PENDING,
    });
    await em.persistAndFlush(messageLog);
    em.clear();

    const request = new Request("http://localhost/api/cron/send-scheduled", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processed).toBe(0);
  });
});
