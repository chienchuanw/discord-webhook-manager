/**
 * 發送含圖片訊息 API 測試
 * TDD: 測試 POST /api/webhooks/[id]/send-with-image 端點
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
import { MikroORM } from "@mikro-orm/sqlite";
import config from "../../../../../mikro-orm.config";
import { Webhook } from "../../../../../db/entities/Webhook";
import { MessageLog } from "../../../../../db/entities/MessageLog";
import { WebhookSchedule } from "../../../../../db/entities/WebhookSchedule";
import { POST } from "./route";

/**
 * 建立測試用的 Blob 物件（模擬圖片檔案）
 */
function createTestImageBlob(): Blob {
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

/**
 * 建立包含圖片的 FormData Request
 */
function createFormDataRequest(
  url: string,
  options: { content?: string; file?: Blob; fileName?: string }
): Request {
  const formData = new FormData();
  if (options.content) {
    formData.append("content", options.content);
  }
  if (options.file) {
    formData.append("file", options.file, options.fileName || "test.png");
  }
  return new Request(url, {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/webhooks/[id]/send-with-image", () => {
  let orm: MikroORM;
  let testWebhookId: string;

  // 測試前初始化資料庫連線
  beforeAll(async () => {
    orm = await MikroORM.init(config);
    global.__orm = orm;
  });

  // 每個測試前建立測試資料
  beforeEach(async () => {
    vi.restoreAllMocks();

    const em = orm.em.fork();
    await em.nativeDelete(MessageLog, {});
    await em.nativeDelete(WebhookSchedule, {});
    await em.nativeDelete(Webhook, {});

    const testWebhook = new Webhook(
      "測試 Webhook",
      "https://discord.com/api/webhooks/test/test"
    );
    await em.persistAndFlush(testWebhook);
    testWebhookId = testWebhook.id;
    em.clear();
  });

  // 測試後關閉連線
  afterAll(async () => {
    await orm.close(true);
    global.__orm = undefined;
  });

  it("成功發送圖片應該回傳 200 和訊息記錄", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 200 })
    );

    const request = createFormDataRequest(
      `http://localhost/api/webhooks/${testWebhookId}/send-with-image`,
      { file: createTestImageBlob() }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.messageLog).toBeDefined();
    expect(data.messageLog.status).toBe("success");
  });

  it("成功發送圖片加文字應該回傳 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 200 })
    );

    const request = createFormDataRequest(
      `http://localhost/api/webhooks/${testWebhookId}/send-with-image`,
      { content: "圖片說明", file: createTestImageBlob() }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.messageLog.content).toBe("圖片說明");
  });

  it("沒有提供 content 和 file 應該回傳 400", async () => {
    const formData = new FormData();
    const request = new Request(
      `http://localhost/api/webhooks/${testWebhookId}/send-with-image`,
      { method: "POST", body: formData }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("訊息內容或圖片至少需要一個");
  });

  it("Webhook 不存在應該回傳 404", async () => {
    const request = createFormDataRequest(
      "http://localhost/api/webhooks/non-existent-id/send-with-image",
      { file: createTestImageBlob() }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "non-existent-id" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Webhook 不存在");
  });

  it("Webhook 已停用應該回傳 400", async () => {
    const em = orm.em.fork();
    const webhook = await em.findOne(Webhook, { id: testWebhookId });
    if (webhook) {
      webhook.isActive = false;
      await em.persistAndFlush(webhook);
    }
    em.clear();

    const request = createFormDataRequest(
      `http://localhost/api/webhooks/${testWebhookId}/send-with-image`,
      { file: createTestImageBlob() }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: testWebhookId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Webhook 已停用");
  });
});
