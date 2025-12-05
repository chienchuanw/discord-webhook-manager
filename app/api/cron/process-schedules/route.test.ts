/**
 * Cron Process Schedules API 測試
 * 測試 /api/cron/process-schedules 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import config from "../../../../mikro-orm.config";
import { Webhook } from "../../../../db/entities/Webhook";
import { WebhookSchedule } from "../../../../db/entities/WebhookSchedule";
import { Template, ScheduleType } from "../../../../db/entities/Template";
import { MessageLog } from "../../../../db/entities/MessageLog";
import { GET } from "./route";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GET /api/cron/process-schedules", () => {
  let orm: MikroORM;
  let em: EntityManager;
  let testWebhook: Webhook;

  beforeAll(async () => {
    orm = await MikroORM.init(config);
    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.updateSchema();
  });

  beforeEach(async () => {
    em = orm.em.fork();
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(WebhookSchedule, {});
    await em.nativeDelete(Webhook, {});
    await em.nativeDelete(Template, {});

    // 建立測試 Webhook
    testWebhook = new Webhook(
      "測試 Webhook",
      "https://discord.com/api/webhooks/123/abc"
    );
    await em.persistAndFlush(testWebhook);

    // 重置 mock
    mockFetch.mockReset();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it("沒有到期排程時應該回傳空結果", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processed).toBe(0);
    expect(data.results).toEqual([]);
  });

  it("應該處理到期的排程", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const schedule = new WebhookSchedule(testWebhook, "測試排程");
    schedule.messageContent = "Hello!";
    schedule.isActive = true;
    schedule.nextTriggerAt = new Date(Date.now() - 60000);
    schedule.scheduleType = ScheduleType.INTERVAL;
    schedule.intervalMinutes = 30;
    await em.persistAndFlush(schedule);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processed).toBe(1);
    expect(data.results[0].success).toBe(true);
  });

  it("應該處理多個到期的排程", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const schedule1 = new WebhookSchedule(testWebhook, "排程一");
    schedule1.messageContent = "訊息一";
    schedule1.isActive = true;
    schedule1.nextTriggerAt = new Date(Date.now() - 60000);
    schedule1.scheduleType = ScheduleType.INTERVAL;
    schedule1.intervalMinutes = 30;

    const schedule2 = new WebhookSchedule(testWebhook, "排程二");
    schedule2.embedData = { title: "公告", description: "內容" };
    schedule2.isActive = true;
    schedule2.nextTriggerAt = new Date(Date.now() - 60000);
    schedule2.scheduleType = ScheduleType.DAILY;
    schedule2.scheduleTime = "09:00";

    await em.persistAndFlush([schedule1, schedule2]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processed).toBe(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("發送失敗時應該記錄錯誤", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Bad Request" }),
    });

    const schedule = new WebhookSchedule(testWebhook, "測試排程");
    schedule.messageContent = "Hello!";
    schedule.isActive = true;
    schedule.nextTriggerAt = new Date(Date.now() - 60000);
    schedule.scheduleType = ScheduleType.INTERVAL;
    schedule.intervalMinutes = 30;
    await em.persistAndFlush(schedule);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processed).toBe(1);
    expect(data.results[0].success).toBe(false);
    expect(data.results[0].error).toBeDefined();
  });
});

