#!/usr/bin/env node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const SWIFT_SOURCE = String.raw `
import AppKit
import CoreGraphics
import Foundation

struct Bounds: Encodable {
  let x: Int
  let y: Int
  let width: Int
  let height: Int
}

struct WindowInfo: Encodable {
  let id: Int
  let owner: String
  let name: String
  let layer: Int
  let bounds: Bounds
  let area: Int
}

struct Response: Encodable {
  let count: Int
  let selected: WindowInfo?
  let windows: [WindowInfo]?
}

func value(for flag: String) -> String? {
  guard let idx = CommandLine.arguments.firstIndex(of: flag) else {
    return nil
  }
  let next = CommandLine.arguments.index(after: idx)
  guard next < CommandLine.arguments.endIndex else {
    return nil
  }
  return CommandLine.arguments[next]
}

let frontmostFlag = CommandLine.arguments.contains("--frontmost")
let explicitApp = value(for: "--app")
let frontmostName = frontmostFlag ? NSWorkspace.shared.frontmostApplication?.localizedName : nil
if frontmostFlag && frontmostName == nil {
  fputs("{\"count\":0}\n", stderr)
  exit(1)
}
let appFilter = (explicitApp ?? frontmostName)?.lowercased()
let nameFilter = value(for: "--window-name")?.lowercased()
let includeList = CommandLine.arguments.contains("--list")

let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
guard let raw = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
  fputs("{\"count\":0}\n", stderr)
  exit(1)
}

var exactMatches: [WindowInfo] = []
var partialMatches: [WindowInfo] = []
exactMatches.reserveCapacity(raw.count)
partialMatches.reserveCapacity(raw.count)

for entry in raw {
  guard let owner = entry[kCGWindowOwnerName as String] as? String else { continue }
  let ownerLower = owner.lowercased()
  if let appFilter, !ownerLower.contains(appFilter) { continue }

  let name = (entry[kCGWindowName as String] as? String) ?? ""
  if let nameFilter, !name.lowercased().contains(nameFilter) { continue }

  guard let number = entry[kCGWindowNumber as String] as? Int else { continue }
  let layer = (entry[kCGWindowLayer as String] as? Int) ?? 0

  guard let boundsDict = entry[kCGWindowBounds as String] as? [String: Any] else { continue }
  let x = Int((boundsDict["X"] as? Double) ?? 0)
  let y = Int((boundsDict["Y"] as? Double) ?? 0)
  let width = Int((boundsDict["Width"] as? Double) ?? 0)
  let height = Int((boundsDict["Height"] as? Double) ?? 0)
  if width <= 0 || height <= 0 { continue }

  let bounds = Bounds(x: x, y: y, width: width, height: height)
  let area = width * height
  let info = WindowInfo(id: number, owner: owner, name: name, layer: layer, bounds: bounds, area: area)
  if let appFilter, ownerLower == appFilter {
    exactMatches.append(info)
  } else {
    partialMatches.append(info)
  }
}

let windows: [WindowInfo]
if appFilter != nil && !exactMatches.isEmpty {
  windows = exactMatches
} else {
  windows = partialMatches
}

func rank(_ window: WindowInfo) -> (Int, Int) {
  let layerScore = window.layer == 0 ? 0 : 1
  return (layerScore, -window.area)
}

let ordered: [WindowInfo]
if frontmostFlag {
  ordered = windows
} else {
  ordered = windows.sorted { rank($0) < rank($1) }
}
let selected = ordered.first

let list: [WindowInfo]?
if includeList {
  list = ordered
} else {
  list = nil
}

let response = Response(count: windows.count, selected: selected, windows: list)
let encoder = JSONEncoder()
encoder.outputFormatting = [.sortedKeys]

if let data = try? encoder.encode(response),
   let json = String(data: data, encoding: .utf8) {
  print(json)
} else {
  fputs("{\"count\":\(windows.count)}\n", stderr)
  exit(1)
}
`;
export function runSwiftSource(source: any, args: any = []): any {
    const workDir = mkdtempSync(join(tmpdir(), "codex-macos-window-"));
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
export function main(argv: any = process.argv.slice(2)): any {
    const result = runSwiftSource(SWIFT_SOURCE, argv);
    if (result.error?.code === "ENOENT") {
        console.error("swift not found; install Xcode command line tools");
        return 1;
    }
    if (result.status !== 0) {
        process.stderr.write(result.stderr || result.stdout || "macOS window helper failed\n");
        return result.status ?? 1;
    }
    process.stdout.write(result.stdout);
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main();
}
