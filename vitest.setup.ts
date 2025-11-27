/**
 * Vitest 測試環境設定檔
 * 在所有測試執行前會先執行此檔案
 */
import * as dotenv from "dotenv";

// 載入測試專用的環境變數
// 這會覆蓋預設的 .env.local 設定，使用獨立的測試資料庫
dotenv.config({ path: ".env.test" });

// 只在需要 DOM 測試時引入 jest-dom
// 服務層測試使用 node 環境，不需要 DOM 擴充
