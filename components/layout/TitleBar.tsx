"use client";

/**
 * TitleBar 元件
 * 提供視窗拖拉功能的標題列區域
 *
 * 當使用 Electron 的 titleBarStyle: "hiddenInset" 時，
 * 需要手動建立可拖拉區域讓使用者能移動視窗
 */
export function TitleBar() {
  return (
    <div
      className="h-8 w-full flex-shrink-0 select-none bg-[#1e1f22]"
      style={{
        // 啟用視窗拖拉功能（Electron 特有的 CSS 屬性）
        // @ts-expect-error - WebkitAppRegion 是 Electron 特有的 CSS 屬性
        WebkitAppRegion: "drag",
        // 預留交通燈按鈕的空間（macOS）
        paddingLeft: "80px",
      }}
    >
      {/* 標題列內容可以在這裡擴充，例如應用程式名稱或搜尋欄 */}
    </div>
  );
}

