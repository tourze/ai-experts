#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const procedure = defineCliProcedure({
  id: "screenshot-macos-display-info",
  entry: procedureEntry(import.meta.url),
  description: "获取 macOS 显示器信息：分辨率、排列方式和缩放因子。",
  owners: { skillIds: ["screenshot"] },
  target: "scripts/macos_display_info.mjs",
  runtime: "node",

  exampleArgs: { args: [] },
});

const SWIFT_SOURCE = String.raw`
import AppKit
import Foundation

struct Response: Encodable {
  let count: Int
  let displays: [Int]
}

let count = max(NSScreen.screens.count, 1)
let displays = Array(1...count)

let response = Response(count: count, displays: displays)
let encoder = JSONEncoder()
encoder.outputFormatting = [.sortedKeys]

if let data = try? encoder.encode(response),
   let json = String(data: data, encoding: .utf8) {
  print(json)
} else {
  fputs("{\"count\":\(count)}\n", stderr)
  exit(1)
}
`;
export function runSwiftSource(source: any, args: any = []): any {
  const workDir = mkdtempSync(join(tmpdir(), "codex-macos-display-"));
  const moduleCache = join(tmpdir(), "codex-swift-module-cache");
  mkdirSync(moduleCache, { recursive: true });
  const scriptPath = join(workDir, "helper.swift");
  writeFileSync(scriptPath, source, "utf8");
  try {
    return spawnSync(
      "swift",
      ["-module-cache-path", moduleCache, scriptPath, ...args],
      {
        encoding: "utf8",
      },
    );
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}
export function runMacosDisplayInfo(argv: readonly string[] = []): any {
  return runSwiftSource(SWIFT_SOURCE, argv);
}
export function main(argv: readonly string[]): any {
  const result = runMacosDisplayInfo(argv);
  if (result.error?.code === "ENOENT") {
    console.error("swift not found; install Xcode command line tools");
    return 1;
  }
  if (result.status !== 0) {
    process.stderr.write(
      result.stderr || result.stdout || "macOS display helper failed\n",
    );
    return result.status ?? 1;
  }
  process.stdout.write(result.stdout);
  return 0;
}
