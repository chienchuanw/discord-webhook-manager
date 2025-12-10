/**
 * Template API Routes 測試
 * TDD: 測試 /api/templates/[id] 的 GET, PATCH, DELETE 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM } from "@mikro-orm/sqlite";
import config from "../../../../mikro-orm.config";
import { Template, ScheduleType } from "../../../../db/entities/Template";
import { WebhookSchedule } from "../../../../db/entities/WebhookSchedule";
import { Webhook } from "../../../../db/entities/Webhook";
import { MessageLog } from "../../../../db/entities/MessageLog";
import { GET, PATCH, DELETE } from "./route";

describe("/api/templates/[id]", () => {
  let orm: MikroORM;
  let testTemplateId: string;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    global.__orm = orm;
  });

  // 每個測試前建立測試資料
  beforeEach(async () => {
    const em = orm.em.fork();
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(WebhookSchedule, {});
    await em.nativeDelete(Webhook, {});
    await em.nativeDelete(Template, {});

    const testTemplate = new Template("測試樣板");
    testTemplate.messageContent = "測試內容";
    testTemplate.scheduleType = ScheduleType.DAILY;
    testTemplate.scheduleTime = "09:00";
    await em.persistAndFlush(testTemplate);
    testTemplateId = testTemplate.id;
    em.clear();
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
    global.__orm = undefined;
  });

  /* ============================================
     GET /api/templates/[id] 測試
     ============================================ */
  describe("GET", () => {
    it("應回傳指定的樣板", async () => {
      const request = new Request(
        `http://localhost/api/templates/${testTemplateId}`
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: testTemplateId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testTemplateId);
      expect(data.name).toBe("測試樣板");
      expect(data.messageContent).toBe("測試內容");
    });

    it("找不到樣板時應回傳 404", async () => {
      const request = new Request(
        "http://localhost/api/templates/00000000-0000-0000-0000-000000000000"
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  /* ============================================
     PATCH /api/templates/[id] 測試
     ============================================ */
  describe("PATCH", () => {
    it("應成功更新樣板名稱", async () => {
      const request = new Request(
        `http://localhost/api/templates/${testTemplateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "更新後名稱" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: testTemplateId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("更新後名稱");
    });

    it("應成功更新多個欄位", async () => {
      const request = new Request(
        `http://localhost/api/templates/${testTemplateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "新名稱",
            messageContent: "新內容",
            embedData: { title: "新標題" },
            scheduleType: "weekly",
            scheduleDays: [1, 5],
          }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: testTemplateId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("新名稱");
      expect(data.messageContent).toBe("新內容");
      expect(data.embedData).toEqual({ title: "新標題" });
      expect(data.scheduleType).toBe("weekly");
      expect(data.scheduleDays).toEqual([1, 5]);
    });

    it("找不到樣板時應回傳 404", async () => {
      const request = new Request(
        "http://localhost/api/templates/00000000-0000-0000-0000-000000000000",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "新名稱" }),
        }
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
      });

      expect(response.status).toBe(404);
    });
  });

  /* ============================================
     DELETE /api/templates/[id] 測試
     ============================================ */
  describe("DELETE", () => {
    it("應成功刪除樣板", async () => {
      const request = new Request(
        `http://localhost/api/templates/${testTemplateId}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: testTemplateId }),
      });

      expect(response.status).toBe(204);
    });

    it("找不到樣板時應回傳 404", async () => {
      const request = new Request(
        "http://localhost/api/templates/00000000-0000-0000-0000-000000000000",
        { method: "DELETE" }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
      });

      expect(response.status).toBe(404);
    });
  });
});

