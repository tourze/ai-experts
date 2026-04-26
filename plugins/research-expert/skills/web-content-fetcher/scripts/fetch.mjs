#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const DEFAULT_MAX_CHARS = 30_000;
const MIN_CONTENT_LENGTH = 200;
const REQUEST_TIMEOUT_MS = 15_000;

const CONTENT_SELECTORS = [
  "article",
  "main",
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".article-detail",
  ".article-holder",
  ".post_body",
  ".markdown-body",
  ".Post-RichText",
  "#article_content",
  ".article-area",
  ".ssa-article",
  '[role="article"]',
  '[itemprop="articleBody"]',
];

const WECHAT_SELECTORS = [
  "div#js_content",
  "div.rich_media_content",
];

const BLOCK_TAGS = ["article", "main", "section", "div", "body"];

const FAST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; ai-experts-web-content-fetcher/1.0)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const STEALTH_HEADERS = {
  ...FAST_HEADERS,
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
};

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function stripTags(value) {
  return String(value).replace(/<[^>]+>/g, "");
}

function cleanInline(value) {
  return decodeEntities(stripTags(value))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMarkdown(value, maxChars = DEFAULT_MAX_CHARS) {
  return value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxChars);
}

function getAttr(attrs, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
  const match = String(attrs).match(pattern);
  return match ? decodeEntities(match[2] ?? match[3] ?? match[4] ?? "") : "";
}

function setAttr(attrs, name, value) {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
  if (pattern.test(attrs)) {
    return attrs.replace(pattern, ` ${name}="${value}"`);
  }
  return `${attrs} ${name}="${value}"`;
}

export function fixLazyImages(htmlRaw) {
  return String(htmlRaw).replace(/<img\b([^>]*)>/gi, (tag, attrs) => {
    const realSrc =
      getAttr(attrs, "data-src") ||
      getAttr(attrs, "data-original") ||
      getAttr(attrs, "data-lazy-src") ||
      getAttr(attrs, "data-actualsrc");

    if (!realSrc) return tag;
    const src = getAttr(attrs, "src");
    if (src && !/^(data:image|about:blank|#|$)/i.test(src)) return tag;
    return `<img${setAttr(attrs, "src", realSrc)}>`;
  });
}

function markdownForImage(attrs) {
  const src = getAttr(attrs, "src");
  if (!src) return "";
  const alt = getAttr(attrs, "alt");
  return `![${alt}](${src})`;
}

function markdownForLink(attrs, body) {
  const text = cleanInline(body);
  const href = getAttr(attrs, "href");
  if (!text) return "";
  return href ? `[${text}](${href})` : text;
}

export function htmlToMarkdown(htmlRaw, maxChars = DEFAULT_MAX_CHARS) {
  let html = fixLazyImages(htmlRaw);

  html = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "");

  html = html.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, body) => {
    const text = decodeEntities(stripTags(body)).trim();
    return text ? `\n\n\`\`\`\n${text}\n\`\`\`\n\n` : "\n\n";
  });

  html = html.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, body) => {
    const title = cleanInline(body);
    return title ? `\n\n${"#".repeat(Number(level))} ${title}\n\n` : "\n\n";
  });

  html = html.replace(/<img\b([^>]*)>/gi, (_, attrs) => `\n\n${markdownForImage(attrs)}\n\n`);
  html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, body) => markdownForLink(attrs, body));
  html = html.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, body) => `\n- ${cleanInline(body)}\n`);
  html = html.replace(/<br\s*\/?>/gi, "\n");
  html = html.replace(/<\/(p|div|section|article|main|blockquote|ul|ol|table|tr)>/gi, "\n\n");
  html = html.replace(/<\/(td|th)>/gi, " | ");
  html = stripTags(html);

  return normalizeMarkdown(decodeEntities(html), maxChars);
}

function parseSelector(selector) {
  const tagId = selector.match(/^([a-z][\w-]*)#([\w-]+)$/i);
  if (tagId) return { tag: tagId[1], id: tagId[2] };

  const tagClass = selector.match(/^([a-z][\w-]*)\.([\w-]+)$/i);
  if (tagClass) return { tag: tagClass[1], className: tagClass[2] };

  if (selector.startsWith("#")) return { id: selector.slice(1) };
  if (selector.startsWith(".")) return { className: selector.slice(1) };

  const attr = selector.match(/^\[([\w-]+)=["']([^"']+)["']\]$/);
  if (attr) return { attrName: attr[1], attrValue: attr[2] };

  if (/^[a-z][\w-]*$/i.test(selector)) return { tag: selector };
  return null;
}

function attrsMatch(attrs, parsed) {
  if (parsed.id && getAttr(attrs, "id") !== parsed.id) return false;
  if (parsed.className) {
    const classes = getAttr(attrs, "class").split(/\s+/).filter(Boolean);
    if (!classes.includes(parsed.className)) return false;
  }
  if (parsed.attrName && getAttr(attrs, parsed.attrName) !== parsed.attrValue) return false;
  return true;
}

function findBySelector(html, selector) {
  const parsed = parseSelector(selector);
  if (!parsed) return "";

  const tags = parsed.tag ? [parsed.tag] : BLOCK_TAGS;
  for (const tag of tags) {
    const pattern = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi");
    for (const match of html.matchAll(pattern)) {
      if (attrsMatch(match[1], parsed)) return match[0];
    }
  }
  return "";
}

export function extractContentFromHtml(htmlRaw, url, maxChars = DEFAULT_MAX_CHARS) {
  const selectors = url.includes("mp.weixin.qq.com")
    ? [...WECHAT_SELECTORS, ...CONTENT_SELECTORS]
    : CONTENT_SELECTORS;

  for (const selector of selectors) {
    const fragment = findBySelector(htmlRaw, selector);
    if (!fragment) continue;
    const markdown = htmlToMarkdown(fragment, maxChars);
    if (markdown.length >= MIN_CONTENT_LENGTH) return { markdown, selector };
  }

  return {
    markdown: htmlToMarkdown(htmlRaw, maxChars),
    selector: "body(fallback)",
  };
}

async function fetchHtml(url, { headers = FAST_HEADERS, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  return await response.text();
}

export async function fetchFast(url, maxChars = DEFAULT_MAX_CHARS) {
  const html = await fetchHtml(url, { headers: FAST_HEADERS });
  return extractContentFromHtml(html, url, maxChars);
}

export async function fetchStealth(url, maxChars = DEFAULT_MAX_CHARS) {
  const html = await fetchHtml(url, { headers: STEALTH_HEADERS, timeoutMs: 30_000 });
  return extractContentFromHtml(html, url, maxChars);
}

export async function fetchContent(url, maxChars = DEFAULT_MAX_CHARS, stealth = false) {
  if (stealth) {
    const { markdown, selector } = await fetchStealth(url, maxChars);
    return { markdown, selector, mode: "stealth-headers" };
  }

  const fast = await fetchFast(url, maxChars);
  if (fast.markdown.length < MIN_CONTENT_LENGTH) {
    try {
      const fallback = await fetchStealth(url, maxChars);
      if (fallback.markdown.length > fast.markdown.length) {
        return { ...fallback, mode: "stealth-headers(auto-fallback)" };
      }
    } catch {
      // Keep the fast result; callers still get the best content found.
    }
  }
  return { ...fast, mode: "fast" };
}

export function parseArgs(argv = process.argv.slice(2)) {
  const positional = [];
  let stealth = false;
  let jsonOutput = false;

  for (const arg of argv) {
    if (arg === "--stealth") stealth = true;
    else if (arg === "--json") jsonOutput = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }

  if (!positional.length) {
    throw new Error("Usage: node fetch.mjs <url> [max_chars] [--stealth] [--json]");
  }

  const maxChars = positional[1] == null ? DEFAULT_MAX_CHARS : Number.parseInt(positional[1], 10);
  if (!Number.isFinite(maxChars) || maxChars <= 0) throw new Error("max_chars must be a positive integer");

  return {
    url: positional[0],
    maxChars,
    stealth,
    jsonOutput,
  };
}

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`${error.message}\n\nOptions:\n  max_chars   Maximum output characters (default: 30000)\n  --stealth   Use browser-like headers for stricter sites\n  --json      Output as JSON with metadata`);
    return 1;
  }

  try {
    const { markdown, selector, mode } = await fetchContent(args.url, args.maxChars, args.stealth);
    if (args.jsonOutput) {
      console.log(JSON.stringify({
        url: args.url,
        mode,
        selector,
        content_length: markdown.length,
        content: markdown,
      }, null, 2));
    } else {
      console.log(markdown);
    }
    return 0;
  } catch (error) {
    const errorMessage = `Error fetching ${args.url}: ${error.name}: ${error.message}`;
    if (args.jsonOutput) {
      console.log(JSON.stringify({ url: args.url, error: errorMessage }));
    } else {
      console.error(errorMessage);
    }
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
