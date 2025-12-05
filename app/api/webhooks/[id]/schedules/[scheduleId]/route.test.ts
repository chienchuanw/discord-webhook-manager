/**
 * WebhookSchedule 單一排程 API 路由測試
 * 測試 /api/webhooks/[id]/schedules/[scheduleId] 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import config from "../../../../../../mikro-orm.config";
import { Webhook } from "../../../../../../db/entities/Webhook";
import { WebhookSchedule } from "../../../../../../db/entities/WebhookSchedule";
import { Template, ScheduleType } from "../../../../../../db/entities/Template";
import { MessageLog } from "../../../../../../db/entities/MessageLog";
import { GET, PATCH, DELETE } from "./route";

describe("/api/webhooks/[id]/schedules/[scheduleId]", () => {
  let orm: MikroORM;
  let em: EntityManager;
  let testWebhook: Webhook;
  let testSchedule: WebhookSchedule;

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
    testSchedule = new WebhookSchedule(testWebhook, "測試排程");
    testSchedule.messageContent = "測試內容";
    await em.persistAndFlush([testWebhook, testSchedule]);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  /* ============================================
     GET 測試
     ============================================ */
  describe("GET", () => {
    it("應該取得單一排程", async () => {
      const request = new Request("http://localhost/xxx");
      const context = {
        params: Promise.resolve({
          id: testWebhook.id,
          scheduleId: testSchedule.id,
        }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testSchedule.id);
      expect(data.name).toBe("測試排程");
    });

    it("排程不存在時應回傳 404", async () => {
      const request = new Request("http://localhost/xxx");
      const context = {
        params: Promise.resolve({
          id: testWebhook.id,
          scheduleId: "00000000-0000-0000-0000-000000000000",
        }),
      };

      const response = await GET(request, context);

      expect(response.status).toBe(404);
    });
  });

  /* ============================================
     PATCH 測試
     ============================================ */
  describe("PATCH", () => {
    it("應該成功更新排程", async () => {
      const request = new Request("http://localhost/xxx", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "更新後名稱",
          isActive: false,
        }),
      });
      const context = {
        params: Promise.resolve({
          id: testWebhook.id,
          scheduleId: testSchedule.id,
        }),
      };

      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("更新後名稱");
      expect(data.isActive).toBe(false);
    });

    it("排程不存在時應回傳 404", async () => {
      const request = new Request("http://localhost/xxx", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "新名稱" }),
      });
      const context = {
        params: Promise.resolve({
          id: testWebhook.id,
          scheduleId: "00000000-0000-0000-0000-000000000000",
        }),
      };

      const response = await PATCH(request, context);

      expect(response.status).toBe(404);
    });
  });

  /* ============================================
     DELETE 測試
     ============================================ */
  describe("DELETE", () => {
    it("應該成功刪除排程", async () => {
      const request = new Request("http://localhost/xxx", { method: "DELETE" });
      const context = {
        params: Promise.resolve({
          id: testWebhook.id,
          scheduleId: testSchedule.id,
        }),
      };

      const response = await DELETE(request, context);

      expect(response.status).toBe(204);
    });

    it("排程不存在時應回傳 404", async () => {
      const request = new Request("http://localhost/xxx", { method: "DELETE" });
      const context = {
        params: Promise.resolve({
          id: testWebhook.id,
          scheduleId: "00000000-0000-0000-0000-000000000000",
        }),
      };

      const response = await DELETE(request, context);

      expect(response.status).toBe(404);
    });
  });
});

