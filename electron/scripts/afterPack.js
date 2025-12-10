/**
 * Electron Builder AfterPack Hook
 * 在打包完成後執行的腳本，用於處理額外的檔案操作
 */

const fs = require("fs");
const path = require("path");

/**
 * AfterPack Hook
 * @param {Object} context - Electron Builder 上下文
 */
exports.default = async function (context) {
  console.log("🔧 執行 afterPack hook...");

  const { appOutDir, packager } = context;
  const platform = packager.platform.name;

  console.log(`📦 平台: ${platform}`);
  console.log(`📁 輸出目錄: ${appOutDir}`);

  // macOS 特定處理
  if (platform === "mac") {
    const appPath = path.join(
      appOutDir,
      `${packager.appInfo.productFilename}.app`
    );
    const resourcesPath = path.join(appPath, "Contents", "Resources");

    console.log(`📂 Resources 路徑: ${resourcesPath}`);

    // 確保 .env.local 被複製到正確位置
    const envSource = path.join(process.cwd(), ".env.local");
    const envDest = path.join(resourcesPath, ".env.local");

    if (fs.existsSync(envSource)) {
      fs.copyFileSync(envSource, envDest);
      console.log("✅ 已複製 .env.local");
    } else {
      console.warn("⚠️  找不到 .env.local 檔案");
    }
  }

  console.log("✅ afterPack hook 完成");
};

