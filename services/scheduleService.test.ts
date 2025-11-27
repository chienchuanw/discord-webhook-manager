/**
 * Schedule Service 測試
 * 測試預約發送訊息相關功能
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
import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import config from "../mikro-orm.config";
import { Webhook } from "../db/entities/Webhook";
import {
  MessageLog,
  MessageStatus,
  ScheduledStatus,
} from "../db/entities/MessageLog";
import {
  createScheduledMessage,
  cancelScheduledMessage,
  getPendingScheduledMessages,
  sendScheduledMessages,
} from "./scheduleService";

describe("scheduleService", () => {
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
    await em.nativeDelete(Webhook, {});

    testWebhook = new Webhook(
      "測試 Webhook",
      "https://discord.com/api/webhooks/test/test"
    );
    await em.persistAndFlush(testWebhook);
  });

  // 測試後關閉資料庫連線
  afterAll(async () => {
    await orm.close(true);
  });

  /* ============================================
     createScheduledMessage 測試
     ============================================ */
  describe("createScheduledMessage", () => {
    it("應該能建立預約訊息", async () => {
      const scheduledAt = new Date(Date.now() + 60 * 60 * 1000); // 1 小時後
      const content = "預約測試訊息";

      const result = await createScheduledMessage(em, {
        webhookId: testWebhook.id,
        content,
        scheduledAt,
      });

      expect(result.success).toBe(true);
      expect(result.messageLog).toBeDefined();
      expect(result.messageLog?.content).toBe(content);
      expect(result.messageLog?.scheduledAt).toEqual(scheduledAt);
      expect(result.messageLog?.scheduledStatus).toBe(ScheduledStatus.PENDING);
    });

    it("Webhook 不存在時應該回傳錯誤", async () => {
      const result = await createScheduledMessage(em, {
        webhookId: "non-existent-id",
        content: "測試訊息",
        scheduledAt: new Date(Date.now() + 60 * 1000),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Webhook 不存在");
    });

    it("Webhook 已停用時應該回傳錯誤", async () => {
      testWebhook.isActive = false;
      await em.persistAndFlush(testWebhook);

      const result = await createScheduledMessage(em, {
        webhookId: testWebhook.id,
        content: "測試訊息",
        scheduledAt: new Date(Date.now() + 60 * 1000),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Webhook 已停用");
    });

    it("預約時間在過去時應該回傳錯誤", async () => {
      const pastTime = new Date(Date.now() - 60 * 1000); // 1 分鐘前

      const result = await createScheduledMessage(em, {
        webhookId: testWebhook.id,
        content: "測試訊息",
        scheduledAt: pastTime,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("預約時間必須在未來");
    });
  });

  /* ============================================
     cancelScheduledMessage 測試
     ============================================ */
  describe("cancelScheduledMessage", () => {
    it("應該能取消預約訊息", async () => {
      // 先建立預約訊息
      const createResult = await createScheduledMessage(em, {
        webhookId: testWebhook.id,
        content: "待取消的訊息",
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const messageLogId = createResult.messageLog!.id;

      // 取消預約
      const cancelResult = await cancelScheduledMessage(em, messageLogId);

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.messageLog?.scheduledStatus).toBe(
        ScheduledStatus.CANCELLED
      );
    });

    it("訊息不存在時應該回傳錯誤", async () => {
      const result = await cancelScheduledMessage(em, "non-existent-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("訊息不存在");
    });

    it("非預約訊息不能取消", async () => {
      // 建立一般訊息（非預約）
      const messageLog = em.create(MessageLog, {
        webhook: testWebhook,
        content: "一般訊息",
        status: MessageStatus.SUCCESS,
        sentAt: new Date(),
      });
      await em.persistAndFlush(messageLog);

      const result = await cancelScheduledMessage(em, messageLog.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe("此訊息不是預約訊息");
    });

    it("已發送的預約訊息不能取消", async () => {
      // 建立已發送的預約訊息
      const messageLog = em.create(MessageLog, {
        webhook: testWebhook,
        content: "已發送的預約訊息",
        status: MessageStatus.SUCCESS,
        scheduledAt: new Date(Date.now() - 60 * 1000),
        scheduledStatus: ScheduledStatus.SENT,
        sentAt: new Date(),
      });
      await em.persistAndFlush(messageLog);

      const result = await cancelScheduledMessage(em, messageLog.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe("此訊息已發送，無法取消");
    });
  });

  /* ============================================
     getPendingScheduledMessages 測試
     ============================================ */
  describe("getPendingScheduledMessages", () => {
    it("應該取得到期的待發送預約訊息", async () => {
      // 建立一個已到期的預約訊息
      const pastScheduledTime = new Date(Date.now() - 60 * 1000);
      const messageLog = em.create(MessageLog, {
        webhook: testWebhook,
        content: "已到期的預約訊息",
        status: MessageStatus.SUCCESS, // 先設定為 success，實際發送前會更新
        scheduledAt: pastScheduledTime,
        scheduledStatus: ScheduledStatus.PENDING,
        sentAt: new Date(),
      });
      await em.persistAndFlush(messageLog);

      const pendingMessages = await getPendingScheduledMessages(em);

      expect(pendingMessages.length).toBe(1);
      expect(pendingMessages[0].content).toBe("已到期的預約訊息");
    });

    it("不應該取得未到期的預約訊息", async () => {
      // 建立一個未到期的預約訊息
      const futureTime = new Date(Date.now() + 60 * 60 * 1000);
      const messageLog = em.create(MessageLog, {
        webhook: testWebhook,
        content: "未到期的預約訊息",
        status: MessageStatus.SUCCESS,
        scheduledAt: futureTime,
        scheduledStatus: ScheduledStatus.PENDING,
        sentAt: new Date(),
      });
      await em.persistAndFlush(messageLog);

      const pendingMessages = await getPendingScheduledMessages(em);

      expect(pendingMessages.length).toBe(0);
    });

    it("不應該取得已取消的預約訊息", async () => {
      const pastTime = new Date(Date.now() - 60 * 1000);
      const messageLog = em.create(MessageLog, {
        webhook: testWebhook,
        content: "已取消的預約訊息",
        status: MessageStatus.SUCCESS,
        scheduledAt: pastTime,
        scheduledStatus: ScheduledStatus.CANCELLED,
        sentAt: new Date(),
      });
      await em.persistAndFlush(messageLog);

      const pendingMessages = await getPendingScheduledMessages(em);

      expect(pendingMessages.length).toBe(0);
    });
  });

  /* ============================================
     sendScheduledMessages 測試
     ============================================ */
  describe("sendScheduledMessages", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("應該發送到期的預約訊息並更新狀態", async () => {
      // Mock fetch 成功
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(null, { status: 204 })
      );

      // 建立到期的預約訊息
      const pastTime = new Date(Date.now() - 60 * 1000);
      const messageLog = em.create(MessageLog, {
        webhook: testWebhook,
        content: "待發送的預約訊息",
        status: MessageStatus.SUCCESS,
        scheduledAt: pastTime,
        scheduledStatus: ScheduledStatus.PENDING,
        sentAt: new Date(),
      });
      await em.persistAndFlush(messageLog);

      const results = await sendScheduledMessages(em);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);

      // 重新查詢確認狀態已更新
      const updatedLog = await em.findOne(MessageLog, { id: messageLog.id });
      expect(updatedLog?.scheduledStatus).toBe(ScheduledStatus.SENT);
    });

    it("發送失敗時應該更新狀態並記錄錯誤", async () => {
      // Mock fetch 失敗
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid Webhook" }), {
          status: 400,
        })
      );

      const pastTime = new Date(Date.now() - 60 * 1000);
      const messageLog = em.create(MessageLog, {
        webhook: testWebhook,
        content: "會失敗的預約訊息",
        status: MessageStatus.SUCCESS,
        scheduledAt: pastTime,
        scheduledStatus: ScheduledStatus.PENDING,
        sentAt: new Date(),
      });
      await em.persistAndFlush(messageLog);

      const results = await sendScheduledMessages(em);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);

      // 重新查詢確認狀態
      const updatedLog = await em.findOne(MessageLog, { id: messageLog.id });
      expect(updatedLog?.scheduledStatus).toBe(ScheduledStatus.SENT);
      expect(updatedLog?.status).toBe("failed");
      expect(updatedLog?.errorMessage).toBeDefined();
    });

    it("Webhook 已停用時應該取消預約訊息", async () => {
      // 停用 Webhook
      testWebhook.isActive = false;
      await em.persistAndFlush(testWebhook);

      const pastTime = new Date(Date.now() - 60 * 1000);
      const messageLog = em.create(MessageLog, {
        webhook: testWebhook,
        content: "Webhook 已停用的預約訊息",
        status: MessageStatus.SUCCESS,
        scheduledAt: pastTime,
        scheduledStatus: ScheduledStatus.PENDING,
        sentAt: new Date(),
      });
      await em.persistAndFlush(messageLog);

      const results = await sendScheduledMessages(em);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain("Webhook 已停用");

      // 確認訊息被標記為取消
      const updatedLog = await em.findOne(MessageLog, { id: messageLog.id });
      expect(updatedLog?.scheduledStatus).toBe(ScheduledStatus.CANCELLED);
    });
  });
});
