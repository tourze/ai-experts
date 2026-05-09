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
  id: "screenshot-macos-permissions",
  entry: procedureEntry(import.meta.url),
  description:
    "检查 macOS 屏幕录制权限状态，可选通过 --request 主动触发系统权限弹窗。",
  owners: { skillIds: ["screenshot"] },
  target: "scripts/macos_permissions.mjs",
  runtime: "node",
  params: [
    {
      flag: "--request",
      type: "",
      description: "主动触发系统权限弹窗，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--request"] },
});

const SWIFT_SOURCE = String.raw`
import CoreGraphics
import Foundation

struct Status: Encodable {
  let screenCapture: Bool
  let requested: Bool
}

let shouldRequest = CommandLine.arguments.contains("--request")

@available(macOS 10.15, *)
func screenCaptureGranted(request: Bool) -> Bool {
  if CGPreflightScreenCaptureAccess() {
    return true
  }
  if request {
    _ = CGRequestScreenCaptureAccess()
    return CGPreflightScreenCaptureAccess()
  }
  return false
}

let granted: Bool
if #available(macOS 10.15, *) {
  granted = screenCaptureGranted(request: shouldRequest)
} else {
  granted = true
}

let status = Status(screenCapture: granted, requested: shouldRequest)
let encoder = JSONEncoder()
encoder.outputFormatting = [.sortedKeys]

if let data = try? encoder.encode(status),
   let json = String(data: data, encoding: .utf8) {
  print(json)
} else {
  fputs("{\"requested\":\(shouldRequest),\"screenCapture\":\(granted)}\n", stderr)
  exit(1)
}
`;
export function runSwiftSource(source: any, args: any = []): any {
  const workDir = mkdtempSync(join(tmpdir(), "codex-macos-permissions-"));
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
export function runMacosPermissions(argv: readonly string[] = []): any {
  return runSwiftSource(SWIFT_SOURCE, argv);
}
export function main(argv: readonly string[]): any {
  const result = runMacosPermissions(argv);
  if (result.error?.code === "ENOENT") {
    console.error("swift not found; install Xcode command line tools");
    return 1;
  }
  if (result.status !== 0) {
    process.stderr.write(
      result.stderr || result.stdout || "macOS permission helper failed\n",
    );
    return result.status ?? 1;
  }
  process.stdout.write(result.stdout);
  return 0;
}
