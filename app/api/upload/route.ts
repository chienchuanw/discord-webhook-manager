/**
 * 圖片上傳 API Route
 * 處理 /api/upload 的 POST 請求
 *
 * 目前使用本地儲存，未來可遷移至 S3
 */
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// 允許的圖片 MIME 類型
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

// 上傳目錄（相對於專案根目錄）
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * 根據 MIME 類型取得副檔名
 */
function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  return extensions[mimeType] || ".bin";
}

/**
 * POST /api/upload
 * 上傳圖片檔案
 *
 * Request: multipart/form-data
 * - file: 圖片檔案（必填，支援 PNG/JPEG/GIF/WebP）
 *
 * Response:
 * - url: 圖片的存取 URL
 * - filename: 儲存的檔案名稱
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // 驗證是否有上傳檔案
    if (!file) {
      return NextResponse.json(
        { error: "缺少必要欄位：file 為必填" },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `不支援的檔案類型：僅支援圖片格式（PNG/JPEG/GIF/WebP）`,
        },
        { status: 400 }
      );
    }

    // 確保上傳目錄存在
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // 產生唯一檔案名稱
    const extension = getExtension(file.type);
    const filename = `${randomUUID()}${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // 讀取檔案內容並寫入
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 回傳檔案 URL
    const url = `/uploads/${filename}`;

    return NextResponse.json(
      {
        url,
        filename,
        size: file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("上傳圖片失敗:", error);
    return NextResponse.json({ error: "上傳圖片失敗" }, { status: 500 });
  }
}

