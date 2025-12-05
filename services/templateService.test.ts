/**
 * Template Service 測試
 * TDD: 先定義預期行為，再實作功能
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MikroORM, EntityManager } from "@mikro-orm/postgresql";
import config from "../mikro-orm.config";
import { Template, ScheduleType } from "../db/entities/Template";
import { WebhookSchedule } from "../db/entities/WebhookSchedule";
import { Webhook } from "../db/entities/Webhook";
import { MessageLog } from "../db/entities/MessageLog";
import {
  createTemplate,
  getTemplateById,
  getAllTemplates,
  updateTemplate,
  deleteTemplate,
  type CreateTemplateParams,
  type UpdateTemplateParams,
} from "./templateService";

describe("templateService", () => {
  let orm: MikroORM;
  let em: EntityManager;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.updateSchema();
  });

  // 每個測試前清空資料
  beforeEach(async () => {
    em = orm.em.fork();
    // 依照外鍵順序清空資料
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(WebhookSchedule, {});
    await em.nativeDelete(Webhook, {});
    await em.nativeDelete(Template, {});
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
  });

  /* ============================================
     createTemplate 測試
     ============================================ */
  describe("createTemplate", () => {
    it("應該成功建立只有純文字的樣板", async () => {
      // Arrange: 準備建立參數
      const params: CreateTemplateParams = {
        name: "每日公告樣板",
        description: "用於發送每日公告",
        messageContent: "大家好，這是每日公告！",
        scheduleType: ScheduleType.DAILY,
        scheduleTime: "09:00",
      };

      // Act: 執行建立
      const template = await createTemplate(em, params);

      // Assert: 驗證結果
      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe("每日公告樣板");
      expect(template.description).toBe("用於發送每日公告");
      expect(template.messageContent).toBe("大家好，這是每日公告！");
      expect(template.scheduleType).toBe(ScheduleType.DAILY);
      expect(template.scheduleTime).toBe("09:00");
      expect(template.createdAt).toBeInstanceOf(Date);
      expect(template.updatedAt).toBeInstanceOf(Date);
    });

    it("應該成功建立含有 Embed 的樣板", async () => {
      // Arrange
      const params: CreateTemplateParams = {
        name: "活動公告樣板",
        embedData: {
          title: "活動公告",
          description: "今日活動內容",
          color: 0x5865f2, // Discord 藍色
          fields: [
            { name: "時間", value: "14:00", inline: true },
            { name: "地點", value: "線上", inline: true },
          ],
        },
        scheduleType: ScheduleType.WEEKLY,
        scheduleTime: "10:00",
        scheduleDays: [1, 3, 5], // 週一、三、五
      };

      // Act
      const template = await createTemplate(em, params);

      // Assert
      expect(template.name).toBe("活動公告樣板");
      expect(template.embedData).toBeDefined();
      expect(template.embedData?.title).toBe("活動公告");
      expect(template.embedData?.color).toBe(0x5865f2);
      expect(template.embedData?.fields).toHaveLength(2);
      expect(template.scheduleType).toBe(ScheduleType.WEEKLY);
      expect(template.scheduleDays).toEqual([1, 3, 5]);
    });

    it("應該成功建立含有圖片的樣板", async () => {
      // Arrange
      const params: CreateTemplateParams = {
        name: "圖片公告樣板",
        messageContent: "看看這張圖片！",
        imageUrl: "https://example.com/image.png",
        scheduleType: ScheduleType.INTERVAL,
        intervalMinutes: 60, // 每小時
      };

      // Act
      const template = await createTemplate(em, params);

      // Assert
      expect(template.imageUrl).toBe("https://example.com/image.png");
      expect(template.scheduleType).toBe(ScheduleType.INTERVAL);
      expect(template.intervalMinutes).toBe(60);
    });

    it("應該在缺少樣板名稱時拋出錯誤", async () => {
      // Arrange
      const params = {
        messageContent: "測試內容",
        scheduleType: ScheduleType.DAILY,
      } as CreateTemplateParams;

      // Act & Assert
      await expect(createTemplate(em, params)).rejects.toThrow();
    });
  });

  /* ============================================
     getTemplateById 測試
     ============================================ */
  describe("getTemplateById", () => {
    it("應該根據 ID 取得樣板", async () => {
      // Arrange: 先建立一個樣板
      const template = new Template("測試樣板");
      template.messageContent = "測試內容";
      await em.persistAndFlush(template);

      // Act
      const found = await getTemplateById(em, template.id);

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe(template.id);
      expect(found?.name).toBe("測試樣板");
    });

    it("當 ID 不存在時應回傳 null", async () => {
      // Act
      const found = await getTemplateById(
        em,
        "00000000-0000-0000-0000-000000000000"
      );

      // Assert
      expect(found).toBeNull();
    });

    it("當 ID 格式錯誤時應回傳 null", async () => {
      // Act
      const found = await getTemplateById(em, "invalid-id");

      // Assert
      expect(found).toBeNull();
    });
  });

  /* ============================================
     getAllTemplates 測試
     ============================================ */
  describe("getAllTemplates", () => {
    it("應該取得所有樣板並按建立時間降序排列", async () => {
      // Arrange: 建立多個樣板，使用明確的時間差
      const now = new Date();

      const template1 = new Template("樣板一");
      template1.createdAt = new Date(now.getTime() - 2000); // 2 秒前

      const template2 = new Template("樣板二");
      template2.createdAt = new Date(now.getTime() - 1000); // 1 秒前

      const template3 = new Template("樣板三");
      template3.createdAt = now; // 現在

      await em.persistAndFlush([template1, template2, template3]);

      // Act
      const templates = await getAllTemplates(em);

      // Assert
      expect(templates).toHaveLength(3);
      // 最新的在前面
      expect(templates[0].name).toBe("樣板三");
      expect(templates[1].name).toBe("樣板二");
      expect(templates[2].name).toBe("樣板一");
    });

    it("當沒有樣板時應回傳空陣列", async () => {
      // Act
      const templates = await getAllTemplates(em);

      // Assert
      expect(templates).toEqual([]);
    });
  });

  /* ============================================
     updateTemplate 測試
     ============================================ */
  describe("updateTemplate", () => {
    it("應該成功更新樣板名稱", async () => {
      // Arrange
      const template = new Template("原始名稱");
      await em.persistAndFlush(template);

      const params: UpdateTemplateParams = {
        name: "新名稱",
      };

      // Act
      const updated = await updateTemplate(em, template.id, params);

      // Assert
      expect(updated).toBeDefined();
      expect(updated?.name).toBe("新名稱");
    });

    it("應該成功更新多個欄位", async () => {
      // Arrange
      const template = new Template("原始樣板");
      template.messageContent = "原始內容";
      template.scheduleType = ScheduleType.DAILY;
      await em.persistAndFlush(template);

      const params: UpdateTemplateParams = {
        name: "更新後樣板",
        messageContent: "更新後內容",
        embedData: { title: "新標題" },
        scheduleType: ScheduleType.WEEKLY,
        scheduleDays: [1, 5],
      };

      // Act
      const updated = await updateTemplate(em, template.id, params);

      // Assert
      expect(updated?.name).toBe("更新後樣板");
      expect(updated?.messageContent).toBe("更新後內容");
      expect(updated?.embedData?.title).toBe("新標題");
      expect(updated?.scheduleType).toBe(ScheduleType.WEEKLY);
      expect(updated?.scheduleDays).toEqual([1, 5]);
    });

    it("當 ID 不存在時應回傳 null", async () => {
      // Arrange
      const params: UpdateTemplateParams = { name: "新名稱" };

      // Act
      const updated = await updateTemplate(
        em,
        "00000000-0000-0000-0000-000000000000",
        params
      );

      // Assert
      expect(updated).toBeNull();
    });
  });

  /* ============================================
     deleteTemplate 測試
     ============================================ */
  describe("deleteTemplate", () => {
    it("應該成功刪除樣板", async () => {
      // Arrange
      const template = new Template("待刪除樣板");
      await em.persistAndFlush(template);
      const templateId = template.id;

      // Act
      const result = await deleteTemplate(em, templateId);

      // Assert
      expect(result).toBe(true);

      // 確認已刪除
      const found = await getTemplateById(em, templateId);
      expect(found).toBeNull();
    });

    it("當 ID 不存在時應回傳 false", async () => {
      // Act
      const result = await deleteTemplate(
        em,
        "00000000-0000-0000-0000-000000000000"
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
