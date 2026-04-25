#!/usr/bin/env node
/**
 * Transcribe audio with whisper.cpp.
 * Usage: node transcribe.mjs <input_audio> <output_prefix> [model_path] [language]
 */

import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";

function usage() {
  console.error("Usage: transcribe.mjs <input_audio> <output_prefix> [model_path] [language]");
  return 1;
}

function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  return spawnSync(checker, [command], { stdio: "ignore" }).status === 0;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
}

function main() {
  for (const command of ["ffmpeg", "ffprobe", "whisper-cli"]) {
    if (!commandExists(command)) {
      console.error(`❌ 缺少 ${command}`);
      return 1;
    }
  }

  const [input, outputPrefix, model = "models/ggml-small.bin", lang = "zh"] = process.argv.slice(2);
  if (!input || !outputPrefix) {
    return usage();
  }
  if (!existsSync(input) || !statSync(input).isFile()) {
    console.error(`❌ 输入文件不存在：${input}`);
    return 1;
  }
  if (!existsSync(model) || !statSync(model).isFile()) {
    console.error(`❌ Whisper 模型不存在：${model}`);
    return 1;
  }

  const wavFile = `${outputPrefix}.wav`;
  const tempDir = mkdtempSync(join(tmpdir(), "whisper-cli-"));
  const logFile = join(tempDir, "run.log");

  try {
    console.log("Converting to WAV...");
    const ffmpeg = run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      input,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      wavFile,
    ]);
    if (ffmpeg.status !== 0) {
      process.stderr.write(ffmpeg.stderr);
      return 1;
    }
    if (!existsSync(wavFile) || statSync(wavFile).size <= 0) {
      console.error("❌ WAV 转换失败");
      return 1;
    }

    const ffprobe = run("ffprobe", ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", wavFile]);
    const duration = (ffprobe.stdout || "").trim().split(".")[0] || "unknown";
    console.log(`Audio duration: ${duration}s`);

    console.log(`Transcribing with whisper.cpp (model: ${basename(model)}, lang: ${lang})...`);
    const whisper = run("whisper-cli", ["-m", model, "-l", lang, "-f", wavFile, "-otxt", "-of", outputPrefix]);
    const logText = `${whisper.stdout || ""}${whisper.stderr || ""}`;
    writeFileSync(logFile, logText, "utf8");
    if (whisper.status !== 0) {
      process.stderr.write(logText.split(/\r?\n/).slice(-20).join("\n"));
      return 1;
    }

    const tail = logText.split(/\r?\n/).filter(Boolean).slice(-5).join("\n");
    if (tail) {
      console.log(tail);
    }
    if (!existsSync(`${outputPrefix}.txt`)) {
      console.error("❌ 未生成转录结果");
      return 1;
    }

    console.log(`Output: ${outputPrefix}.txt`);
    return 0;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

process.exitCode = main();
