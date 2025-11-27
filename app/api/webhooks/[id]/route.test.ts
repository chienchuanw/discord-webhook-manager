/**
 * Webhook API Routes 測試
 * TDD: 測試 /api/webhooks/[id] 的 GET, PATCH, DELETE 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM } from "@mikro-orm/postgresql";
import config from "../../../../mikro-orm.config";
import { Webhook } from "../../../../db/entities/Webhook";
import { MessageLog } from "../../../../db/entities/MessageLog";
import { GET, PATCH, DELETE } from "./route";

describe("/api/webhooks/[id]", () => {
  let orm: MikroORM;
  let testWebhookId: string;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    global.__orm = orm;
  });

  // 每個測試前建立測試資料（先刪除 MessageLog 再刪除 Webhook，避免外鍵約束錯誤）
  beforeEach(async () => {
    const em = orm.em.fork();
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(Webhook, {});
    const testWebhook = new Webhook("測試 Webhook", "https://test.url");
    await em.persistAndFlush(testWebhook);
    // 儲存 ID 而非整個物件，避免 EntityManager 快取問題
    testWebhookId = testWebhook.id;
    // 清除 EntityManager 快取
    em.clear();
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
    global.__orm = undefined;
  });

  /* ============================================
     GET /api/webhooks/[id] 測試
     ============================================ */
  describe("GET", () => {
    it("應該回傳指定的 Webhook", async () => {
      const request = new Request(
        `http://localhost/api/webhooks/${testWebhookId}`
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: testWebhookId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testWebhookId);
      expect(data.name).toBe("測試 Webhook");
    });

    it("找不到 Webhook 時應該回傳 404", async () => {
      const request = new Request(
        "http://localhost/api/webhooks/non-existent-id"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  /* ============================================
     PATCH /api/webhooks/[id] 測試
     ============================================ */
  describe("PATCH", () => {
    it("應該成功更新 Webhook", async () => {
      const request = new Request(
        `http://localhost/api/webhooks/${testWebhookId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "更新後名稱" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testWebhookId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("更新後名稱");
    });

    it("找不到 Webhook 時應該回傳 404", async () => {
      const request = new Request(
        "http://localhost/api/webhooks/non-existent-id",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "更新" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      expect(response.status).toBe(404);
    });
  });

  /* ============================================
     DELETE /api/webhooks/[id] 測試
     ============================================ */
  describe("DELETE", () => {
    it("應該成功刪除 Webhook", async () => {
      const request = new Request(
        `http://localhost/api/webhooks/${testWebhookId}`,
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: testWebhookId }),
      });

      expect(response.status).toBe(204);
    });

    it("找不到 Webhook 時應該回傳 404", async () => {
      const request = new Request(
        "http://localhost/api/webhooks/non-existent-id",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      expect(response.status).toBe(404);
    });
  });
});
