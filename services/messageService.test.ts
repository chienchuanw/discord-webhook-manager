/**
 * Message Service 測試
 * TDD: 先定義預期行為，再實作功能
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
import { MessageLog, MessageStatus } from "../db/entities/MessageLog";
import { WebhookSchedule } from "../db/entities/WebhookSchedule";
import {
  sendMessage,
  sendMessageWithImage,
  getMessageLogs,
  createMessageLog,
  type SendMessageParams,
  type SendMessageResult,
  type SendMessageWithImageParams,
} from "./messageService";

describe("messageService", () => {
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
    // 先清空相關資料表（因為有外鍵約束）
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(WebhookSchedule, {});
    await em.nativeDelete(Webhook, {});

    // 建立測試用 Webhook
    testWebhook = new Webhook(
      "測試 Webhook",
      "https://discord.com/api/webhooks/test/test"
    );
    await em.persistAndFlush(testWebhook);
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
  });

  /* ============================================
     createMessageLog 測試
     ============================================ */
  describe("createMessageLog", () => {
    it("應該能建立成功狀態的訊息記錄", async () => {
      const log = await createMessageLog(em, {
        webhook: testWebhook,
        content: "測試訊息",
        status: MessageStatus.SUCCESS,
        statusCode: 204,
      });

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.content).toBe("測試訊息");
      expect(log.status).toBe(MessageStatus.SUCCESS);
      expect(log.statusCode).toBe(204);
      expect(log.errorMessage).toBeUndefined();
    });

    it("應該能建立失敗狀態的訊息記錄（含錯誤訊息）", async () => {
      const log = await createMessageLog(em, {
        webhook: testWebhook,
        content: "失敗的訊息",
        status: MessageStatus.FAILED,
        statusCode: 400,
        errorMessage: "Bad Request",
      });

      expect(log.status).toBe(MessageStatus.FAILED);
      expect(log.statusCode).toBe(400);
      expect(log.errorMessage).toBe("Bad Request");
    });
  });

  /* ============================================
     getMessageLogs 測試
     ============================================ */
  describe("getMessageLogs", () => {
    it("沒有記錄時應該回傳空陣列", async () => {
      const result = await getMessageLogs(em, testWebhook.id);
      expect(result.messages).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("應該回傳指定 Webhook 的訊息記錄", async () => {
      // 建立多筆記錄
      await createMessageLog(em, {
        webhook: testWebhook,
        content: "訊息 1",
        status: MessageStatus.SUCCESS,
        statusCode: 204,
      });
      await createMessageLog(em, {
        webhook: testWebhook,
        content: "訊息 2",
        status: MessageStatus.SUCCESS,
        statusCode: 204,
      });

      const result = await getMessageLogs(em, testWebhook.id);
      expect(result.messages).toHaveLength(2);
    });

    it("應該按照發送時間降序排列（最新的在前）", async () => {
      await createMessageLog(em, {
        webhook: testWebhook,
        content: "較早的訊息",
        status: MessageStatus.SUCCESS,
        statusCode: 204,
      });

      // 稍等一下確保時間差異
      await new Promise((resolve) => setTimeout(resolve, 10));

      await createMessageLog(em, {
        webhook: testWebhook,
        content: "較新的訊息",
        status: MessageStatus.SUCCESS,
        statusCode: 204,
      });

      const result = await getMessageLogs(em, testWebhook.id);
      expect(result.messages[0].content).toBe("較新的訊息");
      expect(result.messages[1].content).toBe("較早的訊息");
    });

    it("應該限制回傳筆數（預設 20 筆）", async () => {
      // 建立 25 筆記錄
      for (let i = 0; i < 25; i++) {
        await createMessageLog(em, {
          webhook: testWebhook,
          content: `訊息 ${i}`,
          status: MessageStatus.SUCCESS,
          statusCode: 204,
        });
      }

      const result = await getMessageLogs(em, testWebhook.id);
      expect(result.messages).toHaveLength(20);
      expect(result.hasMore).toBe(true);
    });

    it("應該能自訂回傳筆數", async () => {
      for (let i = 0; i < 10; i++) {
        await createMessageLog(em, {
          webhook: testWebhook,
          content: `訊息 ${i}`,
          status: MessageStatus.SUCCESS,
          statusCode: 204,
        });
      }

      const result = await getMessageLogs(em, testWebhook.id, 5);
      expect(result.messages).toHaveLength(5);
    });
  });

  /* ============================================
     sendMessage 測試
     ============================================ */
  describe("sendMessage", () => {
    beforeEach(() => {
      // 重置所有 mock
      vi.restoreAllMocks();
    });

    it("成功發送時應該回傳 success 狀態並記錄到資料庫", async () => {
      // Mock fetch 成功回應
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(null, { status: 204 })
      );

      const params: SendMessageParams = {
        webhookId: testWebhook.id,
        content: "測試成功發送",
      };

      const result = await sendMessage(em, params);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(204);
      expect(result.messageLog).toBeDefined();
      expect(result.messageLog?.status).toBe(MessageStatus.SUCCESS);

      // 確認已記錄到資料庫
      const logsResult = await getMessageLogs(em, testWebhook.id);
      expect(logsResult.messages).toHaveLength(1);
      expect(logsResult.messages[0].content).toBe("測試成功發送");
    });

    it("發送失敗時應該回傳 failed 狀態並記錄錯誤", async () => {
      // Mock fetch 失敗回應
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid Webhook" }), {
          status: 400,
        })
      );

      const params: SendMessageParams = {
        webhookId: testWebhook.id,
        content: "測試失敗發送",
      };

      const result = await sendMessage(em, params);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toBeDefined();
      expect(result.messageLog?.status).toBe(MessageStatus.FAILED);
      expect(result.messageLog?.errorMessage).toBeDefined();
    });

    it("Webhook 不存在時應該回傳錯誤", async () => {
      const params: SendMessageParams = {
        webhookId: "non-existent-id",
        content: "測試訊息",
      };

      const result = await sendMessage(em, params);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Webhook 不存在");
    });

    it("Webhook 停用時應該回傳錯誤", async () => {
      // 將 Webhook 設為停用
      testWebhook.isActive = false;
      await em.persistAndFlush(testWebhook);

      const params: SendMessageParams = {
        webhookId: testWebhook.id,
        content: "測試訊息",
      };

      const result = await sendMessage(em, params);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Webhook 已停用");
    });

    it("網路錯誤時應該記錄失敗", async () => {
      // Mock fetch 拋出錯誤
      vi.spyOn(global, "fetch").mockRejectedValueOnce(
        new Error("Network error")
      );

      const params: SendMessageParams = {
        webhookId: testWebhook.id,
        content: "測試網路錯誤",
      };

      const result = await sendMessage(em, params);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
      expect(result.messageLog?.status).toBe(MessageStatus.FAILED);
    });

    it("成功發送後應該更新 Webhook 的 successCount 和 lastUsed", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(null, { status: 204 })
      );

      const params: SendMessageParams = {
        webhookId: testWebhook.id,
        content: "測試更新計數",
      };

      await sendMessage(em, params);

      // 重新取得 Webhook 確認更新
      const updatedWebhook = await em.findOne(Webhook, { id: testWebhook.id });
      expect(updatedWebhook?.successCount).toBe(1);
      expect(updatedWebhook?.lastUsed).toBeDefined();
    });

    it("發送失敗後應該更新 Webhook 的 failCount", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Error" }), { status: 400 })
      );

      const params: SendMessageParams = {
        webhookId: testWebhook.id,
        content: "測試更新失敗計數",
      };

      await sendMessage(em, params);

      const updatedWebhook = await em.findOne(Webhook, { id: testWebhook.id });
      expect(updatedWebhook?.failCount).toBe(1);
    });
  });

  /* ============================================
     sendMessageWithImage 測試
     ============================================ */
  describe("sendMessageWithImage", () => {
    beforeEach(() => {
      // 重置所有 mock
      vi.restoreAllMocks();
    });

    /**
     * 建立測試用的 Blob 物件（模擬圖片檔案）
     */
    function createTestImageBlob(): Blob {
      // 建立一個簡單的 1x1 PNG 圖片的 binary data
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
      return new Blob([pngData], { type: "image/png" });
    }

    it("應該能成功發送只有圖片的訊息", async () => {
      // Mock fetch 成功回應
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(null, { status: 200 })
      );

      const imageBlob = createTestImageBlob();
      const params: SendMessageWithImageParams = {
        webhookId: testWebhook.id,
        file: imageBlob,
        fileName: "test.png",
      };

      const result = await sendMessageWithImage(em, params);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.messageLog).toBeDefined();
      expect(result.messageLog?.status).toBe(MessageStatus.SUCCESS);
    });

    it("應該能成功發送圖片加文字的訊息", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(null, { status: 200 })
      );

      const imageBlob = createTestImageBlob();
      const params: SendMessageWithImageParams = {
        webhookId: testWebhook.id,
        content: "這是圖片說明",
        file: imageBlob,
        fileName: "test.png",
      };

      const result = await sendMessageWithImage(em, params);

      expect(result.success).toBe(true);
      expect(result.messageLog?.content).toBe("這是圖片說明");
    });

    it("應該使用 FormData 格式發送到 Discord", async () => {
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const imageBlob = createTestImageBlob();
      const params: SendMessageWithImageParams = {
        webhookId: testWebhook.id,
        content: "測試訊息",
        file: imageBlob,
        fileName: "test.png",
      };

      await sendMessageWithImage(em, params);

      // 驗證 fetch 被呼叫時使用了正確的參數
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0];
      // URL 應該包含 ?wait=true 以取得完整的回應（包含 attachments）
      expect(url).toBe(`${testWebhook.url}?wait=true`);
      expect(options?.method).toBe("POST");
      // 驗證 body 是 FormData
      expect(options?.body).toBeInstanceOf(FormData);
    });

    it("沒有提供 content 和 file 時應該回傳錯誤", async () => {
      const params: SendMessageWithImageParams = {
        webhookId: testWebhook.id,
      };

      const result = await sendMessageWithImage(em, params);

      expect(result.success).toBe(false);
      expect(result.error).toBe("訊息內容或圖片至少需要一個");
    });

    it("Webhook 不存在時應該回傳錯誤", async () => {
      const imageBlob = createTestImageBlob();
      const params: SendMessageWithImageParams = {
        webhookId: "non-existent-id",
        file: imageBlob,
        fileName: "test.png",
      };

      const result = await sendMessageWithImage(em, params);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Webhook 不存在");
    });

    it("Webhook 停用時應該回傳錯誤", async () => {
      testWebhook.isActive = false;
      await em.persistAndFlush(testWebhook);

      const imageBlob = createTestImageBlob();
      const params: SendMessageWithImageParams = {
        webhookId: testWebhook.id,
        file: imageBlob,
        fileName: "test.png",
      };

      const result = await sendMessageWithImage(em, params);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Webhook 已停用");
    });

    it("發送失敗時應該記錄錯誤", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid file" }), {
          status: 400,
        })
      );

      const imageBlob = createTestImageBlob();
      const params: SendMessageWithImageParams = {
        webhookId: testWebhook.id,
        file: imageBlob,
        fileName: "test.png",
      };

      const result = await sendMessageWithImage(em, params);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.messageLog?.status).toBe(MessageStatus.FAILED);
    });

    it("網路錯誤時應該記錄失敗", async () => {
      vi.spyOn(global, "fetch").mockRejectedValueOnce(
        new Error("Network error")
      );

      const imageBlob = createTestImageBlob();
      const params: SendMessageWithImageParams = {
        webhookId: testWebhook.id,
        file: imageBlob,
        fileName: "test.png",
      };

      const result = await sendMessageWithImage(em, params);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
      expect(result.messageLog?.status).toBe(MessageStatus.FAILED);
    });

    it("成功發送後應該更新 Webhook 的統計資料", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(null, { status: 200 })
      );

      const imageBlob = createTestImageBlob();
      const params: SendMessageWithImageParams = {
        webhookId: testWebhook.id,
        file: imageBlob,
        fileName: "test.png",
      };

      await sendMessageWithImage(em, params);

      const updatedWebhook = await em.findOne(Webhook, { id: testWebhook.id });
      expect(updatedWebhook?.successCount).toBe(1);
      expect(updatedWebhook?.lastUsed).toBeDefined();
    });
  });
});
