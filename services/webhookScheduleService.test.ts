/**
 * WebhookSchedule Service 測試
 * TDD: 先定義預期行為，再實作功能
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import config from "../mikro-orm.config";
import { Template, ScheduleType } from "../db/entities/Template";
import { WebhookSchedule } from "../db/entities/WebhookSchedule";
import { Webhook } from "../db/entities/Webhook";
import { MessageLog } from "../db/entities/MessageLog";
import {
  createWebhookSchedule,
  getWebhookScheduleById,
  getSchedulesByWebhookId,
  updateWebhookSchedule,
  deleteWebhookSchedule,
  applyTemplateToWebhook,
  type CreateWebhookScheduleParams,
  type UpdateWebhookScheduleParams,
} from "./webhookScheduleService";

describe("webhookScheduleService", () => {
  let orm: MikroORM;
  let em: EntityManager;
  let testWebhook: Webhook;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.updateSchema();
  });

  // 每個測試前清空資料並建立測試 Webhook
  beforeEach(async () => {
    em = orm.em.fork();
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(WebhookSchedule, {});
    await em.nativeDelete(Webhook, {});
    await em.nativeDelete(Template, {});

    // 建立測試用 Webhook
    testWebhook = new Webhook(
      "測試 Webhook",
      "https://discord.com/api/webhooks/123/abc"
    );
    await em.persistAndFlush(testWebhook);
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
  });

  /* ============================================
     createWebhookSchedule 測試
     ============================================ */
  describe("createWebhookSchedule", () => {
    it("應該成功建立排程", async () => {
      const params: CreateWebhookScheduleParams = {
        webhookId: testWebhook.id,
        name: "每日公告",
        messageContent: "大家好！",
        scheduleType: ScheduleType.DAILY,
        scheduleTime: "09:00",
      };

      const schedule = await createWebhookSchedule(em, params);

      expect(schedule).toBeDefined();
      expect(schedule?.id).toBeDefined();
      expect(schedule?.name).toBe("每日公告");
      expect(schedule?.messageContent).toBe("大家好！");
      expect(schedule?.scheduleType).toBe(ScheduleType.DAILY);
      expect(schedule?.scheduleTime).toBe("09:00");
      expect(schedule?.isActive).toBe(true);
      expect(schedule?.webhook.id).toBe(testWebhook.id);
    });

    it("應該成功建立含 Embed 的排程", async () => {
      const params: CreateWebhookScheduleParams = {
        webhookId: testWebhook.id,
        name: "活動公告",
        embedData: {
          title: "活動公告",
          description: "今日活動內容",
          color: 0x5865f2,
        },
        scheduleType: ScheduleType.WEEKLY,
        scheduleTime: "10:00",
        scheduleDays: [1, 3, 5],
      };

      const schedule = await createWebhookSchedule(em, params);

      expect(schedule?.embedData?.title).toBe("活動公告");
      expect(schedule?.scheduleType).toBe(ScheduleType.WEEKLY);
      expect(schedule?.scheduleDays).toEqual([1, 3, 5]);
    });

    it("當 Webhook 不存在時應回傳 null", async () => {
      const params: CreateWebhookScheduleParams = {
        webhookId: "00000000-0000-0000-0000-000000000000",
        name: "測試排程",
        scheduleType: ScheduleType.DAILY,
      };

      const schedule = await createWebhookSchedule(em, params);

      expect(schedule).toBeNull();
    });
  });

  /* ============================================
     getWebhookScheduleById 測試
     ============================================ */
  describe("getWebhookScheduleById", () => {
    it("應該根據 ID 取得排程", async () => {
      const schedule = new WebhookSchedule(testWebhook, "測試排程");
      schedule.messageContent = "測試內容";
      await em.persistAndFlush(schedule);

      const found = await getWebhookScheduleById(em, schedule.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(schedule.id);
      expect(found?.name).toBe("測試排程");
    });

    it("當 ID 不存在時應回傳 null", async () => {
      const found = await getWebhookScheduleById(
        em,
        "00000000-0000-0000-0000-000000000000"
      );

      expect(found).toBeNull();
    });
  });

  /* ============================================
     getSchedulesByWebhookId 測試
     ============================================ */
  describe("getSchedulesByWebhookId", () => {
    it("應該取得指定 Webhook 的所有排程", async () => {
      const schedule1 = new WebhookSchedule(testWebhook, "排程一");
      const schedule2 = new WebhookSchedule(testWebhook, "排程二");
      await em.persistAndFlush([schedule1, schedule2]);

      const schedules = await getSchedulesByWebhookId(em, testWebhook.id);

      expect(schedules).toHaveLength(2);
    });

    it("當沒有排程時應回傳空陣列", async () => {
      const schedules = await getSchedulesByWebhookId(em, testWebhook.id);

      expect(schedules).toEqual([]);
    });
  });

  /* ============================================
     updateWebhookSchedule 測試
     ============================================ */
  describe("updateWebhookSchedule", () => {
    it("應該成功更新排程名稱", async () => {
      const schedule = new WebhookSchedule(testWebhook, "原始名稱");
      await em.persistAndFlush(schedule);

      const params: UpdateWebhookScheduleParams = { name: "新名稱" };
      const updated = await updateWebhookSchedule(em, schedule.id, params);

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("新名稱");
    });

    it("應該成功更新多個欄位", async () => {
      const schedule = new WebhookSchedule(testWebhook, "原始排程");
      schedule.messageContent = "原始內容";
      schedule.isActive = true;
      await em.persistAndFlush(schedule);

      const params: UpdateWebhookScheduleParams = {
        name: "更新後排程",
        messageContent: "更新後內容",
        isActive: false,
        scheduleType: ScheduleType.WEEKLY,
        scheduleDays: [1, 5],
      };
      const updated = await updateWebhookSchedule(em, schedule.id, params);

      expect(updated?.name).toBe("更新後排程");
      expect(updated?.messageContent).toBe("更新後內容");
      expect(updated?.isActive).toBe(false);
      expect(updated?.scheduleType).toBe(ScheduleType.WEEKLY);
      expect(updated?.scheduleDays).toEqual([1, 5]);
    });

    it("當 ID 不存在時應回傳 null", async () => {
      const params: UpdateWebhookScheduleParams = { name: "新名稱" };
      const updated = await updateWebhookSchedule(
        em,
        "00000000-0000-0000-0000-000000000000",
        params
      );

      expect(updated).toBeNull();
    });
  });

  /* ============================================
     deleteWebhookSchedule 測試
     ============================================ */
  describe("deleteWebhookSchedule", () => {
    it("應該成功刪除排程", async () => {
      const schedule = new WebhookSchedule(testWebhook, "待刪除排程");
      await em.persistAndFlush(schedule);
      const scheduleId = schedule.id;

      const result = await deleteWebhookSchedule(em, scheduleId);

      expect(result).toBe(true);

      const found = await getWebhookScheduleById(em, scheduleId);
      expect(found).toBeNull();
    });

    it("當 ID 不存在時應回傳 false", async () => {
      const result = await deleteWebhookSchedule(
        em,
        "00000000-0000-0000-0000-000000000000"
      );

      expect(result).toBe(false);
    });
  });

  /* ============================================
     applyTemplateToWebhook 測試
     ============================================ */
  describe("applyTemplateToWebhook", () => {
    it("應該成功套用樣板到 Webhook", async () => {
      // Arrange: 建立樣板
      const template = new Template("每日公告樣板");
      template.description = "用於每日公告";
      template.messageContent = "大家好，這是每日公告！";
      template.scheduleType = ScheduleType.DAILY;
      template.scheduleTime = "09:00";
      await em.persistAndFlush(template);

      // Act
      const schedule = await applyTemplateToWebhook(
        em,
        template.id,
        testWebhook.id
      );

      // Assert
      expect(schedule).toBeDefined();
      expect(schedule?.name).toBe("每日公告樣板");
      expect(schedule?.messageContent).toBe("大家好，這是每日公告！");
      expect(schedule?.scheduleType).toBe(ScheduleType.DAILY);
      expect(schedule?.scheduleTime).toBe("09:00");
      expect(schedule?.webhook.id).toBe(testWebhook.id);
    });

    it("應該成功套用含 Embed 的樣板", async () => {
      const template = new Template("Embed 樣板");
      template.embedData = {
        title: "活動公告",
        description: "活動內容",
        color: 0x5865f2,
      };
      template.imageUrl = "https://example.com/image.png";
      template.scheduleType = ScheduleType.WEEKLY;
      template.scheduleTime = "10:00";
      template.scheduleDays = [1, 3, 5];
      await em.persistAndFlush(template);

      const schedule = await applyTemplateToWebhook(
        em,
        template.id,
        testWebhook.id
      );

      expect(schedule?.embedData?.title).toBe("活動公告");
      expect(schedule?.imageUrl).toBe("https://example.com/image.png");
      expect(schedule?.scheduleDays).toEqual([1, 3, 5]);
    });

    it("當樣板不存在時應回傳 null", async () => {
      const schedule = await applyTemplateToWebhook(
        em,
        "00000000-0000-0000-0000-000000000000",
        testWebhook.id
      );

      expect(schedule).toBeNull();
    });

    it("當 Webhook 不存在時應回傳 null", async () => {
      const template = new Template("測試樣板");
      await em.persistAndFlush(template);

      const schedule = await applyTemplateToWebhook(
        em,
        template.id,
        "00000000-0000-0000-0000-000000000000"
      );

      expect(schedule).toBeNull();
    });
  });
});
