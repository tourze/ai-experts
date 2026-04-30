#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));

export function main(argv = process.argv.slice(2)) {
  const force = argv.includes("--force") || argv.length === 0;
  const args = [join(scriptDir, "00_probe_env.mjs")];
  if (force) args.push("--force");
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  return result.status ?? 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
