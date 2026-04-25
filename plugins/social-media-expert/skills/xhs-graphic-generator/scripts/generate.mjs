#!/usr/bin/env node
/**
 * Xiaohongshu image generation script - Banana Pro API.
 * Usage: node generate.mjs "English prompt" [aspect_ratio] [resolution]
 * Exit codes: 0=success, 1=create failed, 2=generation failed, 3=filtered, 4=timeout
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://api.mulerun.com/vendors/google/v1/nano-banana-pro/generation";
const MAX_RETRIES = Number(process.env.MULERUN_MAX_RETRIES || 72);
const POLL_INTERVAL_MS = Number(process.env.MULERUN_POLL_INTERVAL_MS || 5000);

function loadDotEnv() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(scriptDir, "..", ".env");
  if (!existsSync(envPath)) {
    return {};
  }

  const values = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...rest] = trimmed.split("=");
    values[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return values;
}

function isContentFilter(text) {
  return /content_filter|policy_violation|content_blocked|nsfw|safety|content/i.test(text);
}

function extractTaskId(payload, raw) {
  return payload?.task_info?.id
    ?? payload?.id
    ?? payload?.taskId
    ?? payload?.task?.id
    ?? raw.match(/"id":"([^"]+)"/)?.[1]
    ?? "";
}

function extractStatus(payload, raw) {
  return String(
    payload?.task_info?.status
      ?? payload?.status
      ?? raw.match(/"status":"([^"]+)"/)?.[1]
      ?? "processing",
  ).toLowerCase();
}

function extractImageUrl(payload, raw) {
  return payload?.images?.[0]
    ?? payload?.image_urls?.[0]
    ?? payload?.output?.images?.[0]
    ?? raw.match(/"images":\["([^"]+)/)?.[1]
    ?? "";
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const raw = await response.text();
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }
  return { ok: response.ok, status: response.status, raw, payload };
}

async function sleep(ms) {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function main() {
  const env = { ...loadDotEnv(), ...process.env };
  const [prompt, aspectRatio = "3:4", resolution = "2K"] = process.argv.slice(2);
  const apiKey = env.MULERUN_API_KEY || "";

  if (!apiKey) {
    console.error("❌ 请设置 MULERUN_API_KEY（在 .env 文件或环境变量中）");
    return 1;
  }
  if (!prompt) {
    console.error("❌ 请提供 Prompt");
    return 1;
  }

  console.log("📤 提交任务...");
  const create = await requestJson(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: aspectRatio,
      resolution,
    }),
  });

  if (!create.ok || /"error"/i.test(create.raw)) {
    if (isContentFilter(create.raw)) {
      console.log("⚠️ 内容被安全过滤器阻止");
      console.log("请尝试：1) 使用其他图片 2) 修改提示词避免敏感内容");
      return 3;
    }
    console.log(`❌ API 错误: ${create.raw || `HTTP ${create.status}`}`);
    return 1;
  }

  const taskId = extractTaskId(create.payload, create.raw);
  if (!taskId) {
    console.log(`❌ 任务创建失败: ${create.raw}`);
    return 1;
  }

  console.log(`✅ Task ID: ${taskId}`);
  console.log(`📐 比例: ${aspectRatio}, 分辨率: ${resolution}`);
  process.stdout.write("⏳ 生成中");

  for (let i = 0; i < MAX_RETRIES; i += 1) {
    await sleep(POLL_INTERVAL_MS);
    const statusResponse = await requestJson(`${API_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const status = extractStatus(statusResponse.payload, statusResponse.raw);

    if (["completed", "succeeded", "success", "done"].includes(status)) {
      const imageUrl = extractImageUrl(statusResponse.payload, statusResponse.raw);
      console.log("");
      if (imageUrl) {
        console.log("✅ 完成!");
        console.log(`IMAGE_URL: ${imageUrl}`);
        return 0;
      }

      console.log("⚠️ 任务完成但未返回图片 URL");
      console.log(`响应: ${statusResponse.raw}`);
      return 2;
    }

    if (["failed", "fail"].includes(status)) {
      console.log("");
      if (isContentFilter(statusResponse.raw)) {
        console.log("⚠️ 内容被安全过滤器阻止");
        console.log("请尝试：1) 使用其他图片 2) 修改提示词避免敏感内容");
        return 3;
      }
      console.log("❌ 生成失败");
      const errorMessage = statusResponse.payload?.task_info?.error
        ?? statusResponse.payload?.error
        ?? statusResponse.payload?.message
        ?? "";
      if (errorMessage) {
        console.log(`错误详情: ${errorMessage}`);
      }
      console.log("可能原因：1) 服务器繁忙 2) 模型无法生成有效输出");
      console.log("请稍后重试");
      return 2;
    }

    process.stdout.write(".");
  }

  console.log("");
  console.log("⏰ 超时 (6分钟)");
  console.log(`手动查询: curl -s '${API_URL}/${taskId}' -H 'Authorization: Bearer ${apiKey}'`);
  return 4;
}

process.exitCode = await main();
