#!/usr/bin/env node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const SWIFT_SOURCE = String.raw `
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
        return spawnSync("swift", ["-module-cache-path", moduleCache, scriptPath, ...args], {
            encoding: "utf8",
        });
    }
    finally {
        rmSync(workDir, { recursive: true, force: true });
    }
}
export function runMacosPermissions(argv: any = []): any {
    return runSwiftSource(SWIFT_SOURCE, argv);
}
export function main(argv: any = process.argv.slice(2)): any {
    const result = runMacosPermissions(argv);
    if (result.error?.code === "ENOENT") {
        console.error("swift not found; install Xcode command line tools");
        return 1;
    }
    if (result.status !== 0) {
        process.stderr.write(result.stderr || result.stdout || "macOS permission helper failed\n");
        return result.status ?? 1;
    }
    process.stdout.write(result.stdout);
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main();
}
