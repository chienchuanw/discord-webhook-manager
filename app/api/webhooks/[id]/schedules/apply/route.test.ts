/**
 * 套用樣板 API 路由測試
 * 測試 /api/webhooks/[id]/schedules/apply 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import config from "../../../../../../mikro-orm.config";
import { Webhook } from "../../../../../../db/entities/Webhook";
import { WebhookSchedule } from "../../../../../../db/entities/WebhookSchedule";
import { Template, ScheduleType } from "../../../../../../db/entities/Template";
import { MessageLog } from "../../../../../../db/entities/MessageLog";
import { POST } from "./route";

describe("/api/webhooks/[id]/schedules/apply", () => {
  let orm: MikroORM;
  let em: EntityManager;
  let testWebhook: Webhook;
  let testTemplate: Template;

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

    // 建立測試資料
    testWebhook = new Webhook(
      "測試 Webhook",
      "https://discord.com/api/webhooks/123/abc"
    );
    testTemplate = new Template("每日公告樣板");
    testTemplate.messageContent = "每日公告內容";
    testTemplate.scheduleType = ScheduleType.DAILY;
    testTemplate.scheduleTime = "09:00";
    await em.persistAndFlush([testWebhook, testTemplate]);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  /* ============================================
     POST 測試
     ============================================ */
  describe("POST", () => {
    it("應該成功套用樣板並建立排程", async () => {
      const request = new Request("http://localhost/xxx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: testTemplate.id }),
      });
      const context = { params: Promise.resolve({ id: testWebhook.id }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("每日公告樣板");
      expect(data.messageContent).toBe("每日公告內容");
      expect(data.scheduleType).toBe(ScheduleType.DAILY);
      expect(data.scheduleTime).toBe("09:00");
    });

    it("缺少 templateId 時應回傳 400", async () => {
      const request = new Request("http://localhost/xxx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const context = { params: Promise.resolve({ id: testWebhook.id }) };

      const response = await POST(request, context);

      expect(response.status).toBe(400);
    });

    it("樣板不存在時應回傳 404", async () => {
      const request = new Request("http://localhost/xxx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "00000000-0000-0000-0000-000000000000",
        }),
      });
      const context = { params: Promise.resolve({ id: testWebhook.id }) };

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });

    it("Webhook 不存在時應回傳 404", async () => {
      const request = new Request("http://localhost/xxx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: testTemplate.id }),
      });
      const context = {
        params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
      };

      const response = await POST(request, context);

      expect(response.status).toBe(404);
    });
  });
});

