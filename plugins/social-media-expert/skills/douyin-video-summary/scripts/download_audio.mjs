#!/usr/bin/env node
/**
 * Download audio from a Douyin CDN direct URL.
 * Usage: node download_audio.mjs <audio_url> <output_file>
 */

import { createWriteStream, statSync, unlinkSync } from "node:fs";
import { pipeline } from "node:stream/promises";

function usage() {
  console.error("Usage: download_audio.mjs <audio_url> <output_file>");
  return 1;
}

function formatMb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

async function main() {
  const [audioUrl, output] = process.argv.slice(2);
  if (!audioUrl || !output) {
    return usage();
  }

  console.log("Downloading audio...");
  const response = await fetch(audioUrl, {
    headers: {
      Referer: "https://www.douyin.com/",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok || !response.body) {
    console.error(`❌ 下载失败：HTTP ${response.status}`);
    return 1;
  }

  try {
    await pipeline(response.body, createWriteStream(output));
  } catch (error) {
    try {
      unlinkSync(output);
    } catch {
      // Ignore cleanup failure; the download error is the actionable failure.
    }
    console.error(`❌ 下载失败：${error.message}`);
    return 1;
  }

  const sizeBytes = statSync(output).size;
  if (sizeBytes <= 0) {
    console.error("❌ 下载失败：输出文件为空");
    return 1;
  }

  console.log(`Done: ${output} (${formatMb(sizeBytes)}MB)`);
  return 0;
}

process.exitCode = await main();
