// @ts-nocheck
/**
 * Electron Preload Script
 * 在渲染程序載入前執行，用於安全地暴露 Node.js API 給網頁
 *
 * 安全性說明：
 * - 使用 contextBridge 可以避免直接暴露 Node.js API
 * - 只暴露必要的功能，減少安全風險
 * - 渲染程序無法直接存取 Node.js，只能透過這裡定義的 API
 *
 * 注意：此檔案使用 CommonJS 格式，這是 Electron 的標準做法
 */

const { contextBridge, ipcRenderer } = require("electron");

/**
 * 透過 contextBridge 暴露安全的 API 給渲染程序
 * 這些 API 可以在網頁中透過 window.electronAPI 存取
 */
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * 平台資訊
   * 讓網頁知道目前執行在什麼平台上
   */
  platform: process.platform,
  isElectron: true,

  /**
   * 取得應用程式版本
   * @returns {Promise<string>} 應用程式版本號
   */
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  /**
   * 取得平台詳細資訊
   * @returns {Promise<{platform: string, arch: string, version: string}>}
   */
  getPlatformInfo: () => ipcRenderer.invoke("get-platform"),

  /**
   * 視窗控制功能
   */
  window: {
    /**
     * 最小化視窗
     */
    minimize: () => ipcRenderer.send("minimize-window"),

    /**
     * 最大化/還原視窗
     */
    maximize: () => ipcRenderer.send("maximize-window"),

    /**
     * 關閉視窗
     */
    close: () => ipcRenderer.send("close-window"),
  },

  /**
   * 檔案系統操作（未來可擴充）
   * 例如：選擇檔案、儲存檔案等
   */
  // fs: {
  //   selectFile: () => ipcRenderer.invoke('select-file'),
  //   saveFile: (data) => ipcRenderer.invoke('save-file', data),
  // },

  /**
   * 通知功能（未來可擴充）
   */
  // notification: {
  //   show: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  // },
});

/**
 * 開發模式下的除錯資訊
 */
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Preload script 已載入");
  console.log("📍 Platform:", process.platform);
}

