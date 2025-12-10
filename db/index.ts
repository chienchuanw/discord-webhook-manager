import { MikroORM, EntityManager } from "@mikro-orm/sqlite";
import * as fs from "fs";
import * as path from "path";
import config from "../mikro-orm.config";

/**
 * 資料庫連線管理模組
 * 使用 singleton pattern 確保只有一個 ORM 實例
 */

// 儲存 ORM 實例的全域變數（開發環境下避免 hot reload 重複建立連線）
declare global {
  // eslint-disable-next-line no-var
  var __orm: MikroORM | undefined;
}

/**
 * 確保資料庫目錄存在
 * SQLite 需要目錄存在才能建立資料庫檔案
 */
function ensureDatabaseDirectory(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 取得 MikroORM 實例
 * 如果尚未初始化則建立新連線
 */
export async function getORM(): Promise<MikroORM> {
  if (!global.__orm) {
    // 確保資料庫目錄存在
    const dbPath = config.dbName as string;
    ensureDatabaseDirectory(dbPath);

    global.__orm = await MikroORM.init(config);

    // 確保資料表存在
    // 測試環境使用 schema generator（避免 TypeScript migration 編譯問題）
    // 生產環境使用 migration
    const generator = global.__orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.updateSchema();
  }
  return global.__orm;
}

/**
 * 取得 EntityManager 實例
 * 用於執行資料庫操作
 */
export async function getEntityManager(): Promise<EntityManager> {
  const orm = await getORM();
  return orm.em.fork();
}

/**
 * 關閉資料庫連線
 * 通常在應用程式結束時呼叫
 */
export async function closeORM(): Promise<void> {
  if (global.__orm) {
    await global.__orm.close();
    global.__orm = undefined;
  }
}
