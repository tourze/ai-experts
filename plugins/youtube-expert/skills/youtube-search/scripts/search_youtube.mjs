#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const DAY_MS = 24 * 60 * 60 * 1000;

export function runYtdlp(query, count, options = {}) {
  const command = options.command ?? "yt-dlp";
  const timeoutMs = options.timeoutMs ?? 60_000;
  const result = spawnSync(
    command,
    [
      `ytsearch${count}:${query}`,
      "--dump-single-json",
      "--flat-playlist",
      "--no-warnings",
    ],
    {
      encoding: "utf-8",
      timeout: timeoutMs,
    },
  );

  if (result.error?.code === "ENOENT") {
    throw new Error("yt-dlp 未安装，请先安装后执行");
  }
  if (result.error?.code === "ETIMEDOUT") {
    throw new Error("yt-dlp 搜索超时，请减少结果数量或稍后重试");
  }
  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || "未知错误";
    throw new Error(`yt-dlp 搜索失败: ${detail}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`yt-dlp 输出不是合法 JSON: ${error.message}`);
  }
}

export function normalizeUploadDate(rawValue) {
  if (!rawValue) {
    return null;
  }

  const raw = String(rawValue);
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}`;
  }
  return raw;
}

export function buildUrl(entry) {
  if (entry.webpage_url) {
    return String(entry.webpage_url);
  }
  if (entry.url) {
    return String(entry.url);
  }
  if (entry.id) {
    return `https://www.youtube.com/watch?v=${entry.id}`;
  }
  return "";
}

export function normalizeEntry(entry) {
  const description = entry.description ? String(entry.description) : "";
  return {
    id: entry.id ?? null,
    title: entry.title || "",
    url: buildUrl(entry),
    channel: entry.channel || entry.uploader || "",
    view_count: entry.view_count ?? null,
    duration_string: entry.duration_string ?? null,
    upload_date: normalizeUploadDate(entry.upload_date),
    description: description.slice(0, 200),
  };
}

export function filterRecent(entries, days, options = {}) {
  if (days == null) {
    return entries;
  }

  const now = options.now ?? new Date();
  const cutoff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - days * DAY_MS;
  return entries.filter((entry) => {
    if (!entry.upload_date) {
      return false;
    }
    const published = Date.parse(`${entry.upload_date}T00:00:00Z`);
    if (Number.isNaN(published)) {
      return false;
    }
    return published >= cutoff;
  });
}

export function sortEntries(entries, sortBy) {
  if (sortBy === "relevance") {
    return entries;
  }
  if (sortBy === "views") {
    return [...entries].sort((left, right) => (right.view_count || -1) - (left.view_count || -1));
  }
  if (sortBy === "newest") {
    return [...entries].sort((left, right) => String(right.upload_date || "").localeCompare(String(left.upload_date || "")));
  }
  throw new Error(`Unsupported sort mode: ${sortBy}`);
}

export function searchVideos(query, options = {}) {
  const count = options.count ?? 10;
  const sortBy = options.sortBy ?? "relevance";
  const days = options.days;
  const runner = options.runner ?? runYtdlp;
  const payload = runner(query, count);
  const rawEntries = Array.isArray(payload.entries) ? payload.entries : [];
  const normalized = rawEntries.filter((entry) => entry && typeof entry === "object").map(normalizeEntry);
  const filtered = filterRecent(normalized, days, options);
  return sortEntries(filtered, sortBy);
}

export function renderTable(entries) {
  const lines = [
    "| 标题 | 频道 | 观看量 | 时长 | 发布日期 | URL |",
    "|---|---|---:|---|---|---|",
  ];

  for (const entry of entries) {
    const title = String(entry.title || "").replaceAll("|", "\\|");
    const channel = String(entry.channel || "").replaceAll("|", "\\|");
    const views = entry.view_count == null ? "" : entry.view_count;
    const duration = entry.duration_string || "";
    const uploadDate = entry.upload_date || "";
    const url = entry.url || "";
    lines.push(`| ${title} | ${channel} | ${views} | ${duration} | ${uploadDate} | ${url} |`);
  }

  return lines.join("\n");
}

function printUsage() {
  console.error(`Usage: node scripts/search_youtube.mjs <query> [options]

Options:
  --count <n>          Number of results to fetch (default: 10)
  --sort <mode>        relevance, views, newest (default: relevance)
  --days <n>           Only keep videos published in the last N days
  --format <format>    json, table, urls (default: json)
  -h, --help           Show this help`);
}

function parseArgs(argv) {
  const args = {
    count: 10,
    sort: "relevance",
    format: "json",
    days: undefined,
    queryParts: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      args.help = true;
      continue;
    }
    if (arg === "--count" || arg === "--sort" || arg === "--days" || arg === "--format") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      if (arg === "--count") {
        args.count = Number(value);
      } else if (arg === "--sort") {
        args.sort = value;
      } else if (arg === "--days") {
        args.days = Number(value);
      } else {
        args.format = value;
      }
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    args.queryParts.push(arg);
  }

  return args;
}

function validateArgs(args) {
  if (args.help) {
    return;
  }
  if (args.queryParts.length === 0) {
    throw new Error("query is required");
  }
  if (!Number.isInteger(args.count) || args.count < 1) {
    throw new Error("--count must be greater than or equal to 1");
  }
  if (args.days !== undefined && (!Number.isInteger(args.days) || args.days < 1)) {
    throw new Error("--days must be greater than or equal to 1");
  }
  if (!["relevance", "views", "newest"].includes(args.sort)) {
    throw new Error("--sort must be one of: relevance, views, newest");
  }
  if (!["json", "table", "urls"].includes(args.format)) {
    throw new Error("--format must be one of: json, table, urls");
  }
}

export function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
    validateArgs(args);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    printUsage();
    return 2;
  }

  if (args.help) {
    printUsage();
    return 0;
  }

  const query = args.queryParts.join(" ");
  let results;
  try {
    results = searchVideos(query, {
      count: args.count,
      sortBy: args.sort,
      days: args.days,
    });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return 1;
  }

  if (args.format === "table") {
    console.log(renderTable(results));
    return 0;
  }

  if (args.format === "urls") {
    for (const entry of results) {
      if (entry.url) {
        console.log(entry.url);
      }
    }
    return 0;
  }

  console.log(JSON.stringify({
    query,
    count: results.length,
    sort: args.sort,
    days: args.days ?? null,
    results,
  }, null, 2));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
