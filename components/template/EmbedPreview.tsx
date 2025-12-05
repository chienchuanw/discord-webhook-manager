"use client";

import * as React from "react";
import { useDeferredValue, useMemo } from "react";
import type { EmbedData } from "@/types/template";
import {
  parseDiscordMarkdown,
  discordMarkdownStyles,
} from "@/lib/discord-markdown";

/* ============================================
   EmbedPreview 元件
   Discord Embed 即時預覽
   模擬 Discord 的 Embed 樣式

   使用 useDeferredValue 優化效能：
   - 延遲非緊急的 UI 更新
   - 減少輸入時的卡頓感
   - 讓 React 可以中斷較低優先級的渲染
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
  // 使用 useDeferredValue 延遲更新，減少頻繁輸入時的重新渲染
  const deferredContent = useDeferredValue(messageContent);
  const deferredEmbedData = useDeferredValue(embedData);
  const deferredImageUrl = useDeferredValue(imageUrl);

  // 判斷預覽是否正在更新中（用於顯示視覺提示）
  const isStale =
    messageContent !== deferredContent ||
    embedData !== deferredEmbedData ||
    imageUrl !== deferredImageUrl;

  // 使用 useMemo 快取計算結果，避免不必要的重新計算
  const embedColor = useMemo(() => {
    return deferredEmbedData?.color
      ? `#${deferredEmbedData.color.toString(16).padStart(6, "0")}`
      : "#202225";
  }, [deferredEmbedData?.color]);

  // 使用 useMemo 快取判斷結果
  const hasEmbed = useMemo(() => {
    return (
      deferredEmbedData &&
      (deferredEmbedData.title ||
        deferredEmbedData.description ||
        deferredEmbedData.author ||
        deferredEmbedData.fields?.length ||
        deferredEmbedData.footer ||
        deferredEmbedData.image ||
        deferredEmbedData.thumbnail ||
        deferredImageUrl)
    );
  }, [deferredEmbedData, deferredImageUrl]);

  return (
    <div
      className={`rounded-md bg-[#313338] p-4 transition-opacity duration-150 ${
        isStale ? "opacity-70" : "opacity-100"
      }`}
    >
      {/* 訊息預覽標題 */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-[#5865f2]" />
        <div>
          <p className="text-sm font-medium text-white">Webhook Bot</p>
          <p className="text-xs text-[#949ba4]">今天 12:00</p>
        </div>
      </div>

      {/* Discord Markdown 樣式 */}
      <style dangerouslySetInnerHTML={{ __html: discordMarkdownStyles }} />

      {/* 純文字訊息（支援 Discord Markdown）*/}
      {deferredContent && (
        <div
          className="mb-2 text-[#dcddde]"
          dangerouslySetInnerHTML={{
            __html: parseDiscordMarkdown(deferredContent),
          }}
        />
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
              {deferredEmbedData?.author && (
                <div className="mb-2 flex items-center gap-2">
                  {deferredEmbedData.author.icon_url && (
                    <img
                      src={deferredEmbedData.author.icon_url}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-white">
                    {deferredEmbedData.author.name}
                  </span>
                </div>
              )}

              {/* Title */}
              {deferredEmbedData?.title && (
                <p className="mb-1 font-semibold text-[#00b0f4]">
                  {deferredEmbedData.title}
                </p>
              )}

              {/* Description（支援 Discord Markdown）*/}
              {deferredEmbedData?.description && (
                <div
                  className="mb-2 text-sm text-[#dcddde]"
                  dangerouslySetInnerHTML={{
                    __html: parseDiscordMarkdown(deferredEmbedData.description),
                  }}
                />
              )}

              {/* Fields（支援 Discord Markdown）*/}
              {deferredEmbedData?.fields &&
                deferredEmbedData.fields.length > 0 && (
                  <div className="mt-2 grid gap-2">
                    {deferredEmbedData.fields.map((field, index) => (
                      <div
                        key={index}
                        className={field.inline ? "inline-block w-1/3" : ""}
                      >
                        <p className="text-xs font-semibold text-white">
                          {field.name}
                        </p>
                        <div
                          className="text-sm text-[#dcddde]"
                          dangerouslySetInnerHTML={{
                            __html: parseDiscordMarkdown(field.value),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

              {/* Image（主圖片或上傳的圖片）*/}
              {(deferredEmbedData?.image?.url || deferredImageUrl) && (
                <div className="mt-3">
                  <img
                    src={deferredEmbedData?.image?.url || deferredImageUrl}
                    alt=""
                    className="max-h-[300px] rounded object-contain"
                  />
                </div>
              )}

              {/* Footer 與 Timestamp */}
              {(deferredEmbedData?.footer || deferredEmbedData?.timestamp) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-[#949ba4]">
                  {deferredEmbedData.footer?.icon_url && (
                    <img
                      src={deferredEmbedData.footer.icon_url}
                      alt=""
                      className="h-5 w-5 rounded-full"
                    />
                  )}
                  {deferredEmbedData.footer?.text && (
                    <span>{deferredEmbedData.footer.text}</span>
                  )}
                  {deferredEmbedData.footer?.text &&
                    deferredEmbedData.timestamp && <span>•</span>}
                  {deferredEmbedData.timestamp && (
                    <span>
                      {new Date(deferredEmbedData.timestamp).toLocaleString(
                        "zh-TW",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail */}
            {deferredEmbedData?.thumbnail?.url && (
              <div className="ml-4 shrink-0">
                <img
                  src={deferredEmbedData.thumbnail.url}
                  alt=""
                  className="h-20 w-20 rounded object-cover"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 空狀態提示 */}
      {!deferredContent && !hasEmbed && (
        <p className="text-center text-sm text-[#949ba4]">
          在左側輸入內容以預覽訊息
        </p>
      )}
    </div>
  );
}
