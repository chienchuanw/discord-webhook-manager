/**
 * 圖片上傳 API 路由測試
 * 測試 /api/upload 端點
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { POST } from "./route";
import fs from "fs";
import path from "path";

// 測試用上傳目錄
const TEST_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

describe("/api/upload", () => {
  // 測試前確保上傳目錄存在
  beforeAll(() => {
    if (!fs.existsSync(TEST_UPLOAD_DIR)) {
      fs.mkdirSync(TEST_UPLOAD_DIR, { recursive: true });
    }
  });

  // 每次測試後清理上傳的測試檔案
  afterAll(() => {
    // 清理測試產生的檔案（只清理測試檔案，保留目錄）
    const files = fs.readdirSync(TEST_UPLOAD_DIR);
    files.forEach((file) => {
      if (file.startsWith("test-")) {
        fs.unlinkSync(path.join(TEST_UPLOAD_DIR, file));
      }
    });
  });

  /* ============================================
     POST 測試
     ============================================ */
  describe("POST", () => {
    it("應該成功上傳 PNG 圖片", async () => {
      // 建立測試用的 PNG 檔案 (1x1 透明像素)
      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      const file = new File([pngBuffer], "test-image.png", {
        type: "image/png",
      });

      const formData = new FormData();
      formData.append("file", file);

      const request = new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.url).toBeDefined();
      expect(data.url).toContain("/uploads/");
      expect(data.filename).toBeDefined();
    });

    it("應該成功上傳 JPEG 圖片", async () => {
      // 建立測試用的最小 JPEG 檔案
      const jpegBuffer = Buffer.from(
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=",
        "base64"
      );
      const file = new File([jpegBuffer], "test-photo.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("file", file);

      const request = new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.url).toContain("/uploads/");
    });

    it("沒有上傳檔案時應回傳 400", async () => {
      const formData = new FormData();

      const request = new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("上傳非圖片檔案時應回傳 400", async () => {
      const textBuffer = Buffer.from("這是一個文字檔案");
      const file = new File([textBuffer], "test.txt", {
        type: "text/plain",
      });

      const formData = new FormData();
      formData.append("file", file);

      const request = new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("圖片");
    });

    it("應該成功上傳 GIF 圖片", async () => {
      // 最小的 GIF 檔案 (1x1 透明像素)
      const gifBuffer = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      const file = new File([gifBuffer], "test-animation.gif", {
        type: "image/gif",
      });

      const formData = new FormData();
      formData.append("file", file);

      const request = new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.url).toContain("/uploads/");
    });

    it("應該成功上傳 WebP 圖片", async () => {
      // 最小的 WebP 檔案
      const webpBuffer = Buffer.from(
        "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
        "base64"
      );
      const file = new File([webpBuffer], "test-modern.webp", {
        type: "image/webp",
      });

      const formData = new FormData();
      formData.append("file", file);

      const request = new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.url).toContain("/uploads/");
    });
  });
});

