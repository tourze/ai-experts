#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = dirname(scriptDir);

function loadDotEnv(envPath) {
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function expandFileArgs(args) {
  return args.map((arg) => {
    if (!arg.startsWith("@")) return arg;

    const filePath = arg.slice(1);
    if (!existsSync(filePath)) return arg;

    return readFileSync(filePath, "utf8").trim();
  });
}

loadDotEnv(join(skillDir, ".env"));

const coreScript = join(scriptDir, "search_news.mjs");
const processedArgs = expandFileArgs(process.argv.slice(2));
const result = spawnSync(process.execPath, [coreScript, ...processedArgs], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Failed to run search_news.mjs: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
