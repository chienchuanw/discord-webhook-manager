/**
 * Discord Markdown 解析器
 * 將 Discord Markdown 語法轉換為 HTML
 *
 * 支援的語法：
 * - **粗體** → <strong>粗體</strong>
 * - *斜體* 或 _斜體_ → <em>斜體</em>
 * - __底線__ → <u>底線</u>
 * - ~~刪除線~~ → <del>刪除線</del>
 * - ||劇透|| → <span class="spoiler">劇透</span>
 * - `行內程式碼` → <code>行內程式碼</code>
 * - ```程式碼區塊``` → <pre><code>程式碼區塊</code></pre>
 * - > 引用 → <blockquote>引用</blockquote>
 * - [文字](連結) → <a href="連結">文字</a>
 */

/* ============================================
   HTML 跳脫處理
   防止 XSS 攻擊
   ============================================ */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/* ============================================
   解析規則定義
   每個規則包含：pattern（正則）和 replacement（替換函數）
   ============================================ */
interface ParseRule {
  pattern: RegExp;
  replacement: (match: string, ...groups: string[]) => string;
}

const parseRules: ParseRule[] = [
  // 程式碼區塊（需要最先處理，避免內部語法被解析）
  {
    pattern: /```(\w*)\n?([\s\S]*?)```/g,
    replacement: (_match, lang, code) => {
      const escapedCode = escapeHtml(code.trim());
      const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      return `<pre><code${langClass}>${escapedCode}</code></pre>`;
    },
  },
  // 行內程式碼
  {
    pattern: /`([^`\n]+)`/g,
    replacement: (_match, code) => `<code>${escapeHtml(code)}</code>`,
  },
  // 劇透（Spoiler）
  {
    pattern: /\|\|(.+?)\|\|/g,
    replacement: (_match, content) =>
      `<span class="discord-spoiler">${escapeHtml(content)}</span>`,
  },
  // 粗體斜體組合 ***text***
  {
    pattern: /\*\*\*(.+?)\*\*\*/g,
    replacement: (_match, content) => `<strong><em>${content}</em></strong>`,
  },
  // 粗體 **text**
  {
    pattern: /\*\*(.+?)\*\*/g,
    replacement: (_match, content) => `<strong>${content}</strong>`,
  },
  // 底線粗體 __**text**__
  {
    pattern: /__\*\*(.+?)\*\*__/g,
    replacement: (_match, content) => `<u><strong>${content}</strong></u>`,
  },
  // 底線 __text__
  {
    pattern: /__(.+?)__/g,
    replacement: (_match, content) => `<u>${content}</u>`,
  },
  // 斜體 *text* 或 _text_
  {
    pattern: /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    replacement: (_match, content) => `<em>${content}</em>`,
  },
  {
    pattern: /(?<!_)_([^_\n]+)_(?!_)/g,
    replacement: (_match, content) => `<em>${content}</em>`,
  },
  // 刪除線 ~~text~~
  {
    pattern: /~~(.+?)~~/g,
    replacement: (_match, content) => `<del>${content}</del>`,
  },
  // 連結 [text](url)
  {
    pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
    replacement: (_match, text, url) => {
      const safeUrl = escapeHtml(url);
      // 只允許 http/https 連結
      if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="discord-link">${escapeHtml(text)}</a>`;
      }
      return escapeHtml(text);
    },
  },
  // 區塊引用 > text（需要在行首）
  {
    pattern: /^> (.+)$/gm,
    replacement: (_match, content) =>
      `<div class="discord-quote"><div class="discord-quote-bar"></div><blockquote>${content}</blockquote></div>`,
  },
];

/* ============================================
   主要解析函數
   ============================================ */
export function parseDiscordMarkdown(text: string): string {
  if (!text) return "";

  let result = text;

  // 依序套用每個解析規則
  for (const rule of parseRules) {
    result = result.replace(rule.pattern, rule.replacement as never);
  }

  // 將換行轉換為 <br>
  result = result.replace(/\n/g, "<br>");

  return result;
}

/* ============================================
   CSS 樣式（供 EmbedPreview 使用）
   ============================================ */
export const discordMarkdownStyles = `
  .discord-spoiler {
    background-color: #1e1f22;
    color: transparent;
    border-radius: 3px;
    padding: 0 2px;
    cursor: pointer;
    transition: all 0.1s ease;
  }
  .discord-spoiler:hover,
  .discord-spoiler.revealed {
    background-color: rgba(255, 255, 255, 0.1);
    color: inherit;
  }
  .discord-link {
    color: #00b0f4;
    text-decoration: none;
  }
  .discord-link:hover {
    text-decoration: underline;
  }
  .discord-quote {
    display: flex;
    margin: 4px 0;
  }
  .discord-quote-bar {
    width: 4px;
    background-color: #4f545c;
    border-radius: 4px;
    margin-right: 8px;
  }
  .discord-quote blockquote {
    margin: 0;
    padding: 0;
  }
  code {
    background-color: #2f3136;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.875em;
  }
  pre {
    background-color: #2f3136;
    border-radius: 4px;
    padding: 8px;
    overflow-x: auto;
    margin: 4px 0;
  }
  pre code {
    background-color: transparent;
    padding: 0;
  }
`;

