/**
 * Webhook Service 測試
 * TDD: 先定義預期行為，再實作功能
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM, EntityManager } from "@mikro-orm/sqlite";
import config from "../mikro-orm.config";
import { Webhook } from "../db/entities/Webhook";
import { MessageLog } from "../db/entities/MessageLog";
import { WebhookSchedule } from "../db/entities/WebhookSchedule";
import {
  createWebhook,
  getWebhookById,
  getAllWebhooks,
  updateWebhook,
  deleteWebhook,
  type CreateWebhookParams,
  type UpdateWebhookParams,
} from "./webhookService";

describe("webhookService", () => {
  let orm: MikroORM;
  let em: EntityManager;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    // 確保資料表存在
    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.updateSchema();
  });

  // 每個測試前清空資料並取得新的 EntityManager
  beforeEach(async () => {
    em = orm.em.fork();
    // 先清空有外鍵約束的資料表
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(WebhookSchedule, {});
    // 再清空 webhook 資料表
    await em.nativeDelete(Webhook, {});
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
  });

  /* ============================================
     createWebhook 測試
     ============================================ */
  describe("createWebhook", () => {
    it("應該成功建立新的 Webhook", async () => {
      const params: CreateWebhookParams = {
        name: "測試 Webhook",
        url: "https://discord.com/api/webhooks/123456/abcdef",
      };

      const webhook = await createWebhook(em, params);

      expect(webhook).toBeDefined();
      expect(webhook.id).toBeDefined();
      expect(webhook.name).toBe(params.name);
      expect(webhook.url).toBe(params.url);
      expect(webhook.isActive).toBe(true);
      expect(webhook.successCount).toBe(0);
      expect(webhook.failCount).toBe(0);
    });

    it("應該可以建立停用狀態的 Webhook", async () => {
      const params: CreateWebhookParams = {
        name: "停用的 Webhook",
        url: "https://discord.com/api/webhooks/789/xyz",
        isActive: false,
      };

      const webhook = await createWebhook(em, params);

      expect(webhook.isActive).toBe(false);
    });
  });

  /* ============================================
     getWebhookById 測試
     ============================================ */
  describe("getWebhookById", () => {
    it("應該能根據 ID 取得 Webhook", async () => {
      // 先建立一個 Webhook
      const created = await createWebhook(em, {
        name: "查詢測試",
        url: "https://discord.com/api/webhooks/test/test",
      });

      const found = await getWebhookById(em, created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe("查詢測試");
    });

    it("查詢不存在的 ID 應該回傳 null", async () => {
      const found = await getWebhookById(em, "non-existent-id");

      expect(found).toBeNull();
    });
  });

  /* ============================================
     getAllWebhooks 測試
     ============================================ */
  describe("getAllWebhooks", () => {
    it("沒有資料時應該回傳空陣列", async () => {
      const webhooks = await getAllWebhooks(em);

      expect(webhooks).toEqual([]);
    });

    it("應該回傳所有 Webhooks", async () => {
      // 建立多個 Webhooks
      await createWebhook(em, { name: "Webhook 1", url: "https://url1.com" });
      await createWebhook(em, { name: "Webhook 2", url: "https://url2.com" });

      const webhooks = await getAllWebhooks(em);

      expect(webhooks).toHaveLength(2);
    });
  });

  /* ============================================
     updateWebhook 測試
     ============================================ */
  describe("updateWebhook", () => {
    it("應該能更新 Webhook 資料", async () => {
      const created = await createWebhook(em, {
        name: "原始名稱",
        url: "https://original.url",
      });

      const updateParams: UpdateWebhookParams = {
        name: "更新後名稱",
        isActive: false,
      };

      const updated = await updateWebhook(em, created.id, updateParams);

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("更新後名稱");
      expect(updated?.isActive).toBe(false);
      expect(updated?.url).toBe("https://original.url"); // URL 不應該被改變
    });

    it("更新不存在的 Webhook 應該回傳 null", async () => {
      const result = await updateWebhook(em, "non-existent-id", {
        name: "test",
      });

      expect(result).toBeNull();
    });
  });

  /* ============================================
     deleteWebhook 測試
     ============================================ */
  describe("deleteWebhook", () => {
    it("應該能刪除 Webhook", async () => {
      const created = await createWebhook(em, {
        name: "待刪除",
        url: "https://delete.me",
      });

      const result = await deleteWebhook(em, created.id);

      expect(result).toBe(true);

      // 確認已刪除
      const found = await getWebhookById(em, created.id);
      expect(found).toBeNull();
    });

    it("刪除不存在的 Webhook 應該回傳 false", async () => {
      const result = await deleteWebhook(em, "non-existent-id");

      expect(result).toBe(false);
    });
  });
});
