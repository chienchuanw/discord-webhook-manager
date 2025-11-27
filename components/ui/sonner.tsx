"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Discord 風格的 Toast 通知元件
 * 使用 sonner 作為底層，並套用 Discord 深色主題樣式
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-center"
      icons={{
        success: <CircleCheckIcon className="size-4 text-discord-green" />,
        info: <InfoIcon className="size-4 text-discord-blurple" />,
        warning: <TriangleAlertIcon className="size-4 text-discord-yellow" />,
        error: <OctagonXIcon className="size-4 text-discord-red" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-[#232428] border-[#3f4147] text-[#dbdee1] shadow-lg",
          title: "text-[#dbdee1] font-medium",
          description: "text-[#949ba4]",
          success: "border-l-4 border-l-discord-green",
          error: "border-l-4 border-l-discord-red",
          warning: "border-l-4 border-l-discord-yellow",
          info: "border-l-4 border-l-discord-blurple",
          actionButton:
            "bg-discord-blurple text-white hover:bg-discord-blurple/90",
          cancelButton: "bg-[#4e5058] text-[#dbdee1] hover:bg-[#6d6f78]",
        },
      }}
      style={
        {
          "--normal-bg": "#232428",
          "--normal-text": "#dbdee1",
          "--normal-border": "#3f4147",
          "--border-radius": "0.5rem",
          "--success-bg": "#232428",
          "--success-text": "#dbdee1",
          "--success-border": "#23a559",
          "--error-bg": "#232428",
          "--error-text": "#dbdee1",
          "--error-border": "#ed4245",
          "--warning-bg": "#232428",
          "--warning-text": "#dbdee1",
          "--warning-border": "#f0b232",
          "--info-bg": "#232428",
          "--info-text": "#dbdee1",
          "--info-border": "#5865f2",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
