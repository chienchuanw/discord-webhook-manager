/**
 * Template API Routes 測試
 * TDD: 測試 /api/templates 的 GET 和 POST 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM } from "@mikro-orm/sqlite";
import config from "../../../mikro-orm.config";
import { Template, ScheduleType } from "../../../db/entities/Template";
import { WebhookSchedule } from "../../../db/entities/WebhookSchedule";
import { Webhook } from "../../../db/entities/Webhook";
import { MessageLog } from "../../../db/entities/MessageLog";
import { GET, POST } from "./route";

describe("/api/templates", () => {
  let orm: MikroORM;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    global.__orm = orm;
  });

  // 每個測試前清空資料
  beforeEach(async () => {
    const em = orm.em.fork();
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(WebhookSchedule, {});
    await em.nativeDelete(Webhook, {});
    await em.nativeDelete(Template, {});
    em.clear();
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
    global.__orm = undefined;
  });

  /* ============================================
     GET /api/templates 測試
     ============================================ */
  describe("GET", () => {
    it("沒有樣板時應回傳空陣列", async () => {
      const request = new Request("http://localhost/api/templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("應回傳所有樣板（按建立時間降序）", async () => {
      // Arrange: 建立測試資料
      const em = orm.em.fork();
      const now = new Date();

      const template1 = new Template("樣板一");
      template1.createdAt = new Date(now.getTime() - 2000);

      const template2 = new Template("樣板二");
      template2.createdAt = new Date(now.getTime() - 1000);

      const template3 = new Template("樣板三");
      template3.createdAt = now;

      await em.persistAndFlush([template1, template2, template3]);
      em.clear();

      // Act
      const request = new Request("http://localhost/api/templates");
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
      expect(data[0].name).toBe("樣板三");
      expect(data[1].name).toBe("樣板二");
      expect(data[2].name).toBe("樣板一");
    });
  });

  /* ============================================
     POST /api/templates 測試
     ============================================ */
  describe("POST", () => {
    it("應成功建立純文字樣板", async () => {
      const request = new Request("http://localhost/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "每日公告樣板",
          description: "用於發送每日公告",
          messageContent: "大家好，這是每日公告！",
          scheduleType: "daily",
          scheduleTime: "09:00",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe("每日公告樣板");
      expect(data.description).toBe("用於發送每日公告");
      expect(data.messageContent).toBe("大家好，這是每日公告！");
      expect(data.scheduleType).toBe("daily");
      expect(data.scheduleTime).toBe("09:00");
    });

    it("應成功建立含 Embed 的樣板", async () => {
      const embedData = {
        title: "活動公告",
        description: "今日活動內容",
        color: 0x5865f2,
        fields: [
          { name: "時間", value: "14:00", inline: true },
          { name: "地點", value: "線上", inline: true },
        ],
      };

      const request = new Request("http://localhost/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "活動公告樣板",
          embedData,
          scheduleType: "weekly",
          scheduleTime: "10:00",
          scheduleDays: [1, 3, 5],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe("活動公告樣板");
      expect(data.embedData).toEqual(embedData);
      expect(data.scheduleType).toBe("weekly");
      expect(data.scheduleDays).toEqual([1, 3, 5]);
    });

    it("缺少樣板名稱時應回傳 400 錯誤", async () => {
      const request = new Request("http://localhost/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageContent: "測試內容",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("name");
    });
  });
});

