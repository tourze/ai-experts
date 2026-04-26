#!/usr/bin/env node
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { countElements, getAccessibilityTree, resolveUdid } from "./interaction_common.mjs";
import { captureScreenshot } from "./screenshot_common.mjs";
import { runXcrunSimctl } from "./simctl_common.mjs";

export class AppStateCapture {
  constructor({ appBundleId = null, udid = null, inline = false, screenshotSize = "half" } = {}) {
    this.appBundleId = appBundleId;
    this.udid = udid;
    this.inline = inline;
    this.screenshotSize = screenshotSize;
  }

  captureAccessibilityTree(outputPath) {
    try {
      const tree = getAccessibilityTree(this.udid, { nested: true });
      writeFileSync(outputPath, `${JSON.stringify(tree, null, 2)}\n`);
      return { captured: true, element_count: countElements(tree) };
    } catch (error) {
      return { captured: false, error: error.message };
    }
  }

  captureLogs(outputPath, lineLimit = 100) {
    if (!this.appBundleId) return { captured: false, reason: "No app bundle ID specified" };
    const appName = this.appBundleId.split(".").at(-1);
    const result = runXcrunSimctl(
      ["spawn", this.udid || "booted", "log", "show", "--predicate", `process == "${appName}"`, "--last", "1m", "--style", "compact"],
      { timeoutMs: 5000 },
    );
    if (result.error) return { captured: false, error: result.error.message };
    const lines = limitLogLines((result.stdout ?? "").split("\n"), lineLimit);
    writeFileSync(outputPath, lines.join("\n"));
    return summarizeLogLines(lines);
  }

  captureDeviceInfo() {
    const args = this.udid ? ["list", "devices"] : ["list", "devices", "booted"];
    const result = runXcrunSimctl(args);
    if (result.status !== 0) return {};
    return parseDeviceInfo(result.stdout ?? "");
  }

  captureAll(outputDir, { logLines = 100, appName = null } = {}) {
    const timestamp = formatTimestamp(new Date());
    const captureDir = this.inline ? null : join(outputDir, `app-state-${timestamp}`);
    if (captureDir) mkdirSync(captureDir, { recursive: true });

    const summary = {
      timestamp: new Date().toISOString(),
      screenshot_mode: this.inline ? "inline" : "file",
    };
    if (captureDir) summary.output_dir = captureDir;

    const screenshotResult = captureScreenshot(this.udid, {
      size: this.screenshotSize,
      inline: this.inline,
      appName,
    });
    if (this.inline) {
      summary.screenshot = {
        mode: "inline",
        base64: screenshotResult.base64_data,
        width: screenshotResult.width,
        height: screenshotResult.height,
        size_preset: this.screenshotSize,
      };
    } else {
      const screenshotPath = join(captureDir, "screenshot.png");
      renameSync(screenshotResult.file_path, screenshotPath);
      summary.screenshot = {
        mode: "file",
        file: "screenshot.png",
        size_bytes: screenshotResult.size_bytes,
      };
    }

    if (captureDir) {
      summary.accessibility = this.captureAccessibilityTree(join(captureDir, "accessibility-tree.json"));
      if (this.appBundleId) summary.logs = this.captureLogs(join(captureDir, "app-logs.txt"), logLines);
    }

    const deviceInfo = this.captureDeviceInfo();
    if (Object.keys(deviceInfo).length) {
      summary.device = deviceInfo;
      if (captureDir) writeFileSync(join(captureDir, "device-info.json"), `${JSON.stringify(deviceInfo, null, 2)}\n`);
    }
    if (captureDir) {
      writeFileSync(join(captureDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
      writeFileSync(join(captureDir, "summary.md"), createSummaryMarkdown(summary));
    }
    return summary;
  }
}

export function parseDeviceInfo(output) {
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes("iPhone") && !line.includes("iPad")) continue;
    const match = line.trim().match(/^(.+?)\s+\(([A-F0-9-]{36})\)\s+\(([^)]+)\)/i);
    if (match) return { name: match[1].trim(), udid: match[2], state: match[3].trim() };
    const parts = line.trim().split("(");
    if (parts[0]) return { name: parts[0].trim() };
  }
  return {};
}

export function limitLogLines(lines, lineLimit = 100) {
  return lines.length > lineLimit ? lines.slice(-lineLimit) : lines;
}

export function summarizeLogLines(lines) {
  return {
    captured: true,
    lines: lines.length,
    warnings: lines.filter((line) => line.toLowerCase().includes("warning")).length,
    errors: lines.filter((line) => line.toLowerCase().includes("error")).length,
  };
}

export function createSummaryMarkdown(summary) {
  const lines = ["# App State Capture", "", `**Timestamp:** ${summary.timestamp}`, ""];
  if (summary.device) {
    lines.push("## Device", `- Name: ${summary.device.name ?? "Unknown"}`, `- UDID: ${summary.device.udid ?? "N/A"}`, `- State: ${summary.device.state ?? "Unknown"}`, "");
  }
  lines.push("## Screenshot", "![Current Screen](screenshot.png)", "");
  if (summary.accessibility) {
    lines.push("## Accessibility");
    if (summary.accessibility.captured) lines.push(`- Elements: ${summary.accessibility.element_count ?? 0}`);
    else lines.push(`- Error: ${summary.accessibility.error ?? "Unknown"}`);
    lines.push("");
  }
  if (summary.logs) {
    lines.push("## Logs");
    if (summary.logs.captured) {
      lines.push(`- Lines: ${summary.logs.lines ?? 0}`, `- Warnings: ${summary.logs.warnings ?? 0}`, `- Errors: ${summary.logs.errors ?? 0}`);
    } else {
      lines.push(`- ${summary.logs.reason ?? summary.logs.error ?? "Not captured"}`);
    }
    lines.push("");
  }
  lines.push("## Files", "- `screenshot.png` - Current screen", "- `accessibility-tree.json` - Full UI hierarchy");
  if (summary.logs) lines.push("- `app-logs.txt` - Recent app logs");
  lines.push("- `device-info.json` - Device details", "- `summary.json` - Complete capture metadata", "");
  return lines.join("\n");
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { appBundleId: null, output: ".", logLines: 100, udid: null, inline: false, size: "half", appName: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--inline") args.inline = true;
    else if (["--app-bundle-id", "--output", "--log-lines", "--udid", "--size", "--app-name"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--app-bundle-id") args.appBundleId = value;
      if (arg === "--output") args.output = value;
      if (arg === "--log-lines") args.logLines = Number.parseInt(value, 10);
      if (arg === "--udid") args.udid = value;
      if (arg === "--size") args.size = value;
      if (arg === "--app-name") args.appName = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.logLines)) throw new Error("--log-lines must be an integer");
  if (!["full", "half", "quarter", "thumb"].includes(args.size)) throw new Error("--size must be one of: full, half, quarter, thumb");
  return args;
}

export function usage() {
  return `Capture complete app state for debugging.

Usage: node scripts/app_state_capture.mjs [options]

Options:
  --app-bundle-id <id>  App bundle ID for log filtering
  --output <dir>        Output directory (default: current directory)
  --log-lines <number>  Number of log lines to capture
  --udid <udid>         Device UDID
  --inline              Return screenshots as base64
  --size <preset>       full, half, quarter, or thumb
  --app-name <name>     App name for semantic screenshot naming
  --help                Show this help
`;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  let udid;
  try {
    udid = resolveUdid(args.udid);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return 1;
  }
  try {
    const capturer = new AppStateCapture({
      appBundleId: args.appBundleId,
      udid,
      inline: args.inline,
      screenshotSize: args.size,
    });
    const summary = capturer.captureAll(args.output, { logLines: args.logLines, appName: args.appName });
    if (summary.output_dir) console.log(`State captured: ${summary.output_dir}/`);
    else console.log(`State captured (inline mode): ${summary.screenshot.width}x${summary.screenshot.height}`);
    if (summary.logs?.captured && (summary.logs.errors > 0 || summary.logs.warnings > 0)) {
      console.log(`Issues found: ${summary.logs.errors} errors, ${summary.logs.warnings} warnings`);
    }
    if (summary.accessibility?.captured) console.log(`Elements: ${summary.accessibility.element_count}`);
    return 0;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return 1;
  }
}

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(
    date.getMinutes(),
  )}${pad(date.getSeconds())}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
