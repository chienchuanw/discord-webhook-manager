/**
 * ScheduleTrigger Service 測試
 * 測試排程觸發與 Discord 訊息發送邏輯
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
import { MikroORM, EntityManager } from "@mikro-orm/sqlite";
import config from "../mikro-orm.config";
import { Webhook } from "../db/entities/Webhook";
import { WebhookSchedule } from "../db/entities/WebhookSchedule";
import { Template, ScheduleType } from "../db/entities/Template";
import { MessageLog } from "../db/entities/MessageLog";
import {
  getDueSchedules,
  sendScheduleMessage,
  processSchedules,
  calculateNextTriggerTime,
  buildDiscordPayload,
} from "./scheduleTriggerService";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("scheduleTriggerService", () => {
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

  /* ============================================
     buildDiscordPayload 測試
     ============================================ */
  describe("buildDiscordPayload", () => {
    it("應該正確建立純文字訊息 payload", () => {
      const schedule = new WebhookSchedule(testWebhook, "測試排程");
      schedule.messageContent = "Hello World!";

      const payload = buildDiscordPayload(schedule);

      expect(payload.content).toBe("Hello World!");
      expect(payload.embeds).toBeUndefined();
    });

    it("應該正確建立 Embed 訊息 payload", () => {
      const schedule = new WebhookSchedule(testWebhook, "測試排程");
      schedule.embedData = {
        title: "公告標題",
        description: "公告內容",
        color: 0x5865f2,
      };

      const payload = buildDiscordPayload(schedule);

      expect(payload.embeds).toHaveLength(1);
      expect(payload.embeds![0].title).toBe("公告標題");
      expect(payload.embeds![0].description).toBe("公告內容");
      expect(payload.embeds![0].color).toBe(0x5865f2);
    });

    it("應該正確處理圖片 URL", () => {
      const schedule = new WebhookSchedule(testWebhook, "測試排程");
      schedule.embedData = { title: "有圖片" };
      schedule.imageUrl = "https://example.com/image.png";

      const payload = buildDiscordPayload(schedule);

      expect(payload.embeds![0].image?.url).toBe(
        "https://example.com/image.png"
      );
    });

    it("應該同時處理文字和 Embed", () => {
      const schedule = new WebhookSchedule(testWebhook, "測試排程");
      schedule.messageContent = "大家好！";
      schedule.embedData = { title: "公告" };

      const payload = buildDiscordPayload(schedule);

      expect(payload.content).toBe("大家好！");
      expect(payload.embeds).toHaveLength(1);
    });
  });

  /* ============================================
     getDueSchedules 測試
     ============================================ */
  describe("getDueSchedules", () => {
    it("應該取得到期的排程", async () => {
      const schedule = new WebhookSchedule(testWebhook, "到期排程");
      schedule.isActive = true;
      schedule.nextTriggerAt = new Date(Date.now() - 60000); // 1 分鐘前
      schedule.messageContent = "測試訊息";
      await em.persistAndFlush(schedule);

      const dueSchedules = await getDueSchedules(em);

      expect(dueSchedules).toHaveLength(1);
      expect(dueSchedules[0].name).toBe("到期排程");
    });

    it("不應該取得未到期的排程", async () => {
      const schedule = new WebhookSchedule(testWebhook, "未到期排程");
      schedule.isActive = true;
      schedule.nextTriggerAt = new Date(Date.now() + 3600000); // 1 小時後
      await em.persistAndFlush(schedule);

      const dueSchedules = await getDueSchedules(em);

      expect(dueSchedules).toHaveLength(0);
    });

    it("不應該取得已停用的排程", async () => {
      const schedule = new WebhookSchedule(testWebhook, "停用排程");
      schedule.isActive = false;
      schedule.nextTriggerAt = new Date(Date.now() - 60000);
      await em.persistAndFlush(schedule);

      const dueSchedules = await getDueSchedules(em);

      expect(dueSchedules).toHaveLength(0);
    });
  });

  /* ============================================
     sendScheduleMessage 測試
     ============================================ */
  describe("sendScheduleMessage", () => {
    it("應該成功發送訊息", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const schedule = new WebhookSchedule(testWebhook, "測試排程");
      schedule.messageContent = "Hello!";
      await em.persistAndFlush(schedule);

      const result = await sendScheduleMessage(em, schedule);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        testWebhook.url,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("發送失敗時應該回傳錯誤", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Bad Request" }),
      });

      const schedule = new WebhookSchedule(testWebhook, "測試排程");
      schedule.messageContent = "Hello!";
      await em.persistAndFlush(schedule);

      const result = await sendScheduleMessage(em, schedule);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("Webhook 停用時不應該發送", async () => {
      testWebhook.isActive = false;
      await em.flush();

      const schedule = new WebhookSchedule(testWebhook, "測試排程");
      schedule.messageContent = "Hello!";
      await em.persistAndFlush(schedule);

      const result = await sendScheduleMessage(em, schedule);

      expect(result.success).toBe(false);
      expect(result.error).toContain("停用");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  /* ============================================
     calculateNextTriggerTime 測試
     ============================================ */
  describe("calculateNextTriggerTime", () => {
    it("INTERVAL 類型應該根據間隔計算下次時間", () => {
      const schedule = new WebhookSchedule(testWebhook, "間隔排程");
      schedule.scheduleType = ScheduleType.INTERVAL;
      schedule.intervalMinutes = 30;

      const now = new Date();
      const nextTime = calculateNextTriggerTime(schedule, now);

      expect(nextTime.getTime()).toBe(now.getTime() + 30 * 60 * 1000);
    });

    it("DAILY 類型應該計算明天的指定時間", () => {
      const schedule = new WebhookSchedule(testWebhook, "每日排程");
      schedule.scheduleType = ScheduleType.DAILY;
      schedule.scheduleTime = "09:00";

      const now = new Date("2025-12-05T10:00:00");
      const nextTime = calculateNextTriggerTime(schedule, now);

      // 因為現在是 10:00，已過 09:00，所以應該是明天
      expect(nextTime.getHours()).toBe(9);
      expect(nextTime.getMinutes()).toBe(0);
      expect(nextTime.getDate()).toBe(6);
    });

    it("WEEKLY 類型應該計算下週符合條件的日期", () => {
      const schedule = new WebhookSchedule(testWebhook, "每週排程");
      schedule.scheduleType = ScheduleType.WEEKLY;
      schedule.scheduleTime = "10:00";
      schedule.scheduleDays = [1, 3, 5]; // 週一、三、五

      // 假設現在是週五下午（2025-12-05 是週五）
      const now = new Date("2025-12-05T15:00:00");
      const nextTime = calculateNextTriggerTime(schedule, now);

      // 下次應該是週一（12/8）
      expect(nextTime.getDay()).toBe(1); // 週一
    });
  });

  /* ============================================
     processSchedules 測試
     ============================================ */
  describe("processSchedules", () => {
    it("應該處理所有到期的排程", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const schedule1 = new WebhookSchedule(testWebhook, "排程一");
      schedule1.messageContent = "訊息一";
      schedule1.isActive = true;
      schedule1.nextTriggerAt = new Date(Date.now() - 60000);
      schedule1.scheduleType = ScheduleType.INTERVAL;
      schedule1.intervalMinutes = 30;

      const schedule2 = new WebhookSchedule(testWebhook, "排程二");
      schedule2.messageContent = "訊息二";
      schedule2.isActive = true;
      schedule2.nextTriggerAt = new Date(Date.now() - 60000);
      schedule2.scheduleType = ScheduleType.INTERVAL;
      schedule2.intervalMinutes = 60;

      await em.persistAndFlush([schedule1, schedule2]);

      const results = await processSchedules(em);

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("處理後應該更新 nextTriggerAt", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const schedule = new WebhookSchedule(testWebhook, "間隔排程");
      schedule.messageContent = "測試";
      schedule.isActive = true;
      schedule.nextTriggerAt = new Date(Date.now() - 60000);
      schedule.scheduleType = ScheduleType.INTERVAL;
      schedule.intervalMinutes = 30;
      await em.persistAndFlush(schedule);

      await processSchedules(em);

      // 重新載入確認更新
      em.clear();
      const updated = await em.findOne(WebhookSchedule, { id: schedule.id });
      expect(updated?.nextTriggerAt).toBeDefined();
      expect(updated?.nextTriggerAt!.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
