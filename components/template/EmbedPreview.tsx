"use client";

import * as React from "react";
import type { EmbedData } from "@/types/template";

/* ============================================
   EmbedPreview 元件
   Discord Embed 即時預覽
   模擬 Discord 的 Embed 樣式
   ============================================ */

interface EmbedPreviewProps {
  messageContent?: string;
  embedData?: EmbedData;
  imageUrl?: string;
}

export function EmbedPreview({
  messageContent,
  embedData,
  imageUrl,
}: EmbedPreviewProps) {
  // 取得 Embed 顏色
  const embedColor = embedData?.color
    ? `#${embedData.color.toString(16).padStart(6, "0")}`
    : "#202225";

  // 判斷是否有任何內容
  const hasEmbed =
    embedData &&
    (embedData.title ||
      embedData.description ||
      embedData.author ||
      embedData.fields?.length ||
      embedData.footer ||
      embedData.image ||
      embedData.thumbnail ||
      imageUrl);

  return (
    <div className="rounded-md bg-[#313338] p-4">
      {/* 訊息預覽標題 */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-[#5865f2]" />
        <div>
          <p className="text-sm font-medium text-white">Webhook Bot</p>
          <p className="text-xs text-[#949ba4]">今天 12:00</p>
        </div>
      </div>

      {/* 純文字訊息 */}
      {messageContent && (
        <p className="mb-2 whitespace-pre-wrap text-[#dcddde]">
          {messageContent}
        </p>
      )}

      {/* Embed 區塊 */}
      {hasEmbed && (
        <div
          className="relative mt-2 overflow-hidden rounded border-l-4 bg-[#2b2d31]"
          style={{ borderLeftColor: embedColor }}
        >
          <div className="flex p-3">
            {/* 主要內容區 */}
            <div className="min-w-0 flex-1">
              {/* Author */}
              {embedData?.author && (
                <div className="mb-2 flex items-center gap-2">
                  {embedData.author.icon_url && (
                    <img
                      src={embedData.author.icon_url}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-white">
                    {embedData.author.name}
                  </span>
                </div>
              )}

              {/* Title */}
              {embedData?.title && (
                <p className="mb-1 font-semibold text-[#00b0f4]">
                  {embedData.title}
                </p>
              )}

              {/* Description */}
              {embedData?.description && (
                <p className="mb-2 whitespace-pre-wrap text-sm text-[#dcddde]">
                  {embedData.description}
                </p>
              )}

              {/* Fields */}
              {embedData?.fields && embedData.fields.length > 0 && (
                <div className="mt-2 grid gap-2">
                  {embedData.fields.map((field, index) => (
                    <div
                      key={index}
                      className={field.inline ? "inline-block w-1/3" : ""}
                    >
                      <p className="text-xs font-semibold text-white">
                        {field.name}
                      </p>
                      <p className="text-sm text-[#dcddde]">{field.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Image（主圖片或上傳的圖片）*/}
              {(embedData?.image?.url || imageUrl) && (
                <div className="mt-3">
                  <img
                    src={embedData?.image?.url || imageUrl}
                    alt=""
                    className="max-h-[300px] rounded object-contain"
                  />
                </div>
              )}

              {/* Footer */}
              {embedData?.footer && (
                <div className="mt-3 flex items-center gap-2 text-xs text-[#949ba4]">
                  {embedData.footer.icon_url && (
                    <img
                      src={embedData.footer.icon_url}
                      alt=""
                      className="h-5 w-5 rounded-full"
                    />
                  )}
                  <span>{embedData.footer.text}</span>
                </div>
              )}
            </div>

            {/* Thumbnail */}
            {embedData?.thumbnail?.url && (
              <div className="ml-4 flex-shrink-0">
                <img
                  src={embedData.thumbnail.url}
                  alt=""
                  className="h-20 w-20 rounded object-cover"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 空狀態提示 */}
      {!messageContent && !hasEmbed && (
        <p className="text-center text-sm text-[#949ba4]">
          在左側輸入內容以預覽訊息
        </p>
      )}
    </div>
  );
}
