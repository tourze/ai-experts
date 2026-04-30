#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { main as analyzeMain } from "./analyze.mjs";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const legacyEnvFile = join(os.homedir(), ".site-analyzer-env.json");
const modernEnvFile = join(os.homedir(), ".site-analyze", "env.json");

function showUsage() {
  console.log("Usage: node site-analyze.mjs <domain>");
  console.log("       node site-analyze.mjs --setup       # re-run env probe");
  console.log("       node site-analyze.mjs --show-env    # print cached env");
  console.log("");
  console.log("Examples:");
  console.log("  node site-analyze.mjs example.com");
  console.log("  node site-analyze.mjs https://example.com/path");
}

export async function main(argv = process.argv.slice(2)) {
  if (!argv.length || argv[0] === "--help" || argv[0] === "-h") {
    showUsage();
    return 0;
  }

  if (argv[0] === "--setup") {
    const result = spawnSync(process.execPath, [join(scriptDir, "00_probe_env.mjs"), "--force"], { stdio: "inherit" });
    return result.status ?? 1;
  }

  if (argv[0] === "--show-env") {
    const envFile = existsSync(modernEnvFile) ? modernEnvFile : legacyEnvFile;
    if (existsSync(envFile)) {
      process.stdout.write(readFileSync(envFile, "utf8"));
      return 0;
    }
    console.log("No env cached yet. Run: node site-analyze.mjs --setup");
    return 1;
  }

  return analyzeMain(argv);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
