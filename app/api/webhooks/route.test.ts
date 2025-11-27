/**
 * Webhook API Routes 測試
 * TDD: 測試 /api/webhooks 的 GET 和 POST 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM } from "@mikro-orm/postgresql";
import config from "../../../mikro-orm.config";
import { Webhook } from "../../../db/entities/Webhook";
import { GET, POST } from "./route";

describe("/api/webhooks", () => {
  let orm: MikroORM;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    // 設定全域 ORM 供 API 使用
    global.__orm = orm;
  });

  // 每個測試前清空資料
  beforeEach(async () => {
    const em = orm.em.fork();
    await em.nativeDelete(Webhook, {});
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
    global.__orm = undefined;
  });

  /* ============================================
     GET /api/webhooks 測試
     ============================================ */
  describe("GET", () => {
    it("沒有資料時應該回傳空陣列", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("應該回傳所有 Webhooks", async () => {
      // 先建立測試資料
      const em = orm.em.fork();
      const webhook1 = new Webhook("Webhook 1", "https://url1.com");
      const webhook2 = new Webhook("Webhook 2", "https://url2.com");
      await em.persistAndFlush([webhook1, webhook2]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
    });
  });

  /* ============================================
     POST /api/webhooks 測試
     ============================================ */
  describe("POST", () => {
    it("應該成功建立新的 Webhook", async () => {
      const request = new Request("http://localhost/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "測試 Webhook",
          url: "https://discord.com/api/webhooks/123/abc",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("測試 Webhook");
      expect(data.url).toBe("https://discord.com/api/webhooks/123/abc");
      expect(data.id).toBeDefined();
    });

    it("缺少必要欄位時應該回傳 400 錯誤", async () => {
      const request = new Request("http://localhost/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "測試 Webhook",
          // 缺少 url
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});

