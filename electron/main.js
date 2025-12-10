// @ts-nocheck
/**
 * Electron 主程序
 * 負責建立應用程式視窗、管理生命週期、處理系統整合
 *
 * 注意：此檔案使用 CommonJS 格式，這是 Electron 的標準做法
 */

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

/**
 * 主視窗實例
 * 儲存在全域變數以便在不同函式中存取
 */
let mainWindow = null;

/**
 * Next.js 伺服器程序
 * 在生產模式下需要啟動 Next.js 伺服器
 */
let nextServerProcess = null;

/**
 * 啟動 Next.js 伺服器（僅生產模式）
 * 在開發模式下，Next.js 伺服器已經由 pnpm dev 啟動
 */
function startNextServer() {
  return new Promise((resolve, reject) => {
    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // 開發模式：伺服器已由 concurrently 啟動
      console.log("🔧 開發模式：使用外部 Next.js 伺服器");
      resolve();
      return;
    }

    // 生產模式：啟動 Next.js 伺服器
    console.log("🚀 啟動 Next.js 伺服器...");

    // 設定路徑 - 在打包後的應用程式中需要使用正確的路徑
    const appPath = app.getAppPath();
    const isPackaged = app.isPackaged;

    // .env.local 在打包後會被放到 Resources 資料夾
    const envPath = isPackaged
      ? path.join(process.resourcesPath, ".env.local")
      : path.join(appPath, ".env.local");

    // 載入環境變數
    require("dotenv").config({ path: envPath });

    // 設定 SQLite 資料庫路徑
    // 生產模式：使用使用者資料目錄（確保資料持久化）
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "app.db");
    process.env.DATABASE_PATH = dbPath;

    console.log(`📁 應用程式路徑: ${appPath}`);
    console.log(`📁 環境變數路徑: ${envPath}`);
    console.log(`📁 資料庫路徑: ${dbPath}`);
    console.log(`📦 是否已打包: ${isPackaged}`);

    // Next.js CLI 路徑
    const nextCliPath = path.join(appPath, "node_modules", "next", "dist", "bin", "next");

    console.log(`📁 Next.js CLI 路徑: ${nextCliPath}`);

    // 尋找系統 Node.js 路徑
    // 使用系統 Node.js 而不是 Electron 執行檔，避免在 Dock 顯示額外圖示
    const { execSync } = require("child_process");
    let nodePath;

    try {
      // 嘗試找到系統安裝的 Node.js
      nodePath = execSync("which node", { encoding: "utf-8" }).trim();
      console.log(`📁 使用系統 Node.js: ${nodePath}`);
    } catch {
      // 如果找不到系統 Node.js，使用 Electron 內建的 Node.js
      nodePath = process.execPath;
      console.log(`📁 使用 Electron Node.js: ${nodePath}`);
    }

    // 啟動 Next.js 伺服器
    // 使用系統 Node.js 來避免在 Dock 顯示額外的 "exec" 圖示
    nextServerProcess = spawn(nodePath, [nextCliPath, "start", "-p", "3000"], {
      cwd: appPath,
      env: {
        ...process.env,
        NODE_ENV: "production",
        // 只有在使用 Electron 執行檔時才需要這個環境變數
        ...(nodePath === process.execPath ? { ELECTRON_RUN_AS_NODE: "1" } : {}),
      },
      stdio: ["pipe", "pipe", "pipe"],
      // Windows: 隱藏子程序的視窗
      windowsHide: true,
    });

    // 輸出 Next.js 伺服器的日誌
    nextServerProcess.stdout.on("data", (data) => {
      console.log(`[Next.js] ${data.toString().trim()}`);
    });

    nextServerProcess.stderr.on("data", (data) => {
      console.error(`[Next.js Error] ${data.toString().trim()}`);
    });

    nextServerProcess.on("error", (err) => {
      console.error("❌ Next.js 伺服器啟動失敗:", err);
      reject(err);
    });

    nextServerProcess.on("close", (code) => {
      console.log(`[Next.js] 程序已結束，退出碼: ${code}`);
    });

    // 等待伺服器啟動（檢查 http://localhost:3000 是否可用）
    const checkServer = (attempt = 0) => {
      const maxAttempts = 30; // 最多等待 30 秒
      const http = require("http");

      const req = http.get("http://localhost:3000", (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) {
          console.log("✅ Next.js 伺服器已啟動");
          resolve();
        } else if (attempt < maxAttempts) {
          setTimeout(() => checkServer(attempt + 1), 1000);
        } else {
          reject(new Error("Next.js 伺服器啟動超時"));
        }
      });

      req.on("error", () => {
        if (attempt < maxAttempts) {
          setTimeout(() => checkServer(attempt + 1), 1000);
        } else {
          reject(new Error("Next.js 伺服器啟動超時"));
        }
      });

      req.end();
    };

    // 開始檢查伺服器狀態
    setTimeout(() => checkServer(), 2000);
  });
}

/**
 * 建立主視窗
 * 這是應用程式的主要視窗，會載入 Next.js 應用程式
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    // 視窗尺寸設定
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,

    // 視窗外觀設定
    title: "Discord Webhook Manager",
    backgroundColor: "#1a1a1a", // 深色背景，符合 Discord 風格

    // 安全性與整合設定
    webPreferences: {
      // 關閉 Node.js 整合（安全性最佳實踐）
      nodeIntegration: false,

      // 啟用上下文隔離（安全性最佳實踐）
      contextIsolation: true,

      // 載入 preload script 以安全地暴露 API
      preload: path.join(__dirname, "preload.js"),

      // 允許使用 Web API（如 fetch）
      webSecurity: true,
    },

    // macOS 特定設定
    titleBarStyle: "hiddenInset", // 隱藏標題列但保留交通燈按鈕
    trafficLightPosition: { x: 10, y: 10 }, // 調整交通燈位置
  });

  // 根據環境載入不同的內容
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // 開發模式：載入 Next.js 開發伺服器
    mainWindow.loadURL("http://localhost:3003");

    // 自動開啟開發者工具
    mainWindow.webContents.openDevTools();

    console.log("🚀 開發模式：已連接到 http://localhost:3003");
  } else {
    // 生產模式：載入打包後的 Next.js 應用程式
    // Next.js 在生產模式下會啟動內建伺服器
    mainWindow.loadURL("http://localhost:3000");

    console.log("📦 生產模式：已連接到 Next.js 伺服器");
  }

  // 視窗關閉時的清理工作
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 處理外部連結（在預設瀏覽器中開啟）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
}

/**
 * 當 Electron 完成初始化並準備好建立視窗時觸發
 */
app.whenReady().then(async () => {
  // 先啟動 Next.js 伺服器（生產模式）
  try {
    await startNextServer();
  } catch (err) {
    console.error("❌ 無法啟動 Next.js 伺服器:", err);
    app.quit();
    return;
  }

  // 建立主視窗
  createWindow();

  // macOS 特有行為：當點擊 Dock 圖示且沒有視窗時，重新建立視窗
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  console.log("✅ Electron 應用程式已啟動");
});

/**
 * 當所有視窗關閉時的處理
 * Windows & Linux：退出應用程式
 * macOS：保持應用程式執行（符合 macOS 慣例）
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * 應用程式即將退出時的清理工作
 */
app.on("will-quit", () => {
  console.log("👋 應用程式即將關閉");

  // 關閉 Next.js 伺服器
  if (nextServerProcess) {
    console.log("🛑 關閉 Next.js 伺服器...");
    nextServerProcess.kill();
    nextServerProcess = null;
  }
});

/**
 * IPC 通訊處理
 * 處理來自渲染程序的請求
 */

// 範例：取得應用程式版本
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// 範例：取得平台資訊
ipcMain.handle("get-platform", () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
  };
});

// 範例：最小化視窗
ipcMain.on("minimize-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// 範例：最大化/還原視窗
ipcMain.on("maximize-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

// 範例：關閉視窗
ipcMain.on("close-window", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

