/**
 * WebhookSchedule API 路由測試
 * 測試 /api/webhooks/[id]/schedules 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM, EntityManager } from "@mikro-orm/sqlite";
import config from "../../../../../mikro-orm.config";
import { Webhook } from "../../../../../db/entities/Webhook";
import { WebhookSchedule } from "../../../../../db/entities/WebhookSchedule";
import { Template, ScheduleType } from "../../../../../db/entities/Template";
import { MessageLog } from "../../../../../db/entities/MessageLog";
import { GET, POST } from "./route";

describe("/api/webhooks/[id]/schedules", () => {
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
  });

  afterAll(async () => {
    await orm.close(true);
  });

  /* ============================================
     GET 測試
     ============================================ */
  describe("GET", () => {
    it("應該取得指定 Webhook 的所有排程", async () => {
      // Arrange
      const schedule1 = new WebhookSchedule(testWebhook, "排程一");
      const schedule2 = new WebhookSchedule(testWebhook, "排程二");
      await em.persistAndFlush([schedule1, schedule2]);

      const request = new Request("http://localhost/api/webhooks/xxx/schedules");
      const context = { params: Promise.resolve({ id: testWebhook.id }) };

      // Act
      const response = await GET(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
    });

    it("當 Webhook 沒有排程時應回傳空陣列", async () => {
      const request = new Request("http://localhost/api/webhooks/xxx/schedules");
      const context = { params: Promise.resolve({ id: testWebhook.id }) };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  /* ============================================
     POST 測試
     ============================================ */
  describe("POST", () => {
    it("應該成功建立排程", async () => {
      const request = new Request("http://localhost/api/webhooks/xxx/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "每日公告",
          messageContent: "大家好！",
          scheduleType: "daily",
          scheduleTime: "09:00",
        }),
      });
      const context = { params: Promise.resolve({ id: testWebhook.id }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("每日公告");
      expect(data.messageContent).toBe("大家好！");
      expect(data.scheduleType).toBe(ScheduleType.DAILY);
    });

    it("缺少 name 欄位時應回傳 400", async () => {
      const request = new Request("http://localhost/api/webhooks/xxx/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageContent: "測試" }),
      });
      const context = { params: Promise.resolve({ id: testWebhook.id }) };

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("Webhook 不存在時應回傳 404", async () => {
      const request = new Request("http://localhost/api/webhooks/xxx/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "測試排程" }),
      });
      const context = {
        params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
      };

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });
  });
});

