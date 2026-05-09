#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { mkdirSync, renameSync, writeFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  countElements,
  getAccessibilityTree,
  resolveUdid,
} from "./interaction_common";
import { captureScreenshot } from "./screenshot_common";
import { runXcrunSimctl } from "./simctl_common";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-app-state-capture",
  entry: procedureEntry(import.meta.url),
  description:
    "采集 iOS 模拟器应用全状态：截图、无障碍树、应用日志和设备信息，输出到指定目录并生成 summary。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/app_state_capture.mjs",
  runtime: "node",
  params: [
    {
      flag: "--app-bundle-id",
      type: "字符串",
      description: "应用 bundle ID，用于日志过滤",
      required: false,
    },
    {
      flag: "--output",
      type: "路径",
      description: "输出目录路径",
      required: false,
    },
    {
      flag: "--log-lines",
      type: "数字",
      description: "要捕获的日志行数",
      required: false,
    },
    {
      flag: "--udid",
      type: "字符串",
      description: "目标设备 UDID",
      required: false,
    },
    {
      flag: "--inline",
      type: "",
      description: "以 base64 返回截图，传此标志即启用",
      required: false,
    },
    {
      flag: "--size",
      type: "字符串",
      description: "截图尺寸：full, half, quarter, thumb",
      required: false,
    },
    {
      flag: "--app-name",
      type: "字符串",
      description: "应用名称，用于语义化截图命名",
      required: false,
    },
  ],

  exampleArgs: {
    args: ["--app-bundle-id", "com.example.app", "--output", "./state-capture"],
  },
});

export class AppStateCapture {
  appBundleId: any;
  inline: any;
  screenshotSize: any;
  udid: any;
  constructor({
    appBundleId = null,
    udid = null,
    inline = false,
    screenshotSize = "half",
  }: any = {}) {
    this.appBundleId = appBundleId;
    this.udid = udid;
    this.inline = inline;
    this.screenshotSize = screenshotSize;
  }
  captureAccessibilityTree(outputPath: any): any {
    try {
      const tree = getAccessibilityTree(this.udid, { nested: true });
      writeFileSync(outputPath, `${JSON.stringify(tree, null, 2)}\n`);
      return { captured: true, element_count: countElements(tree) };
    } catch (error: any) {
      return { captured: false, error: error.message };
    }
  }
  captureLogs(outputPath: any, lineLimit: any = 100): any {
    if (!this.appBundleId)
      return { captured: false, reason: "No app bundle ID specified" };
    const appName = this.appBundleId.split(".").at(-1);
    const result = runXcrunSimctl(
      [
        "spawn",
        this.udid || "booted",
        "log",
        "show",
        "--predicate",
        `process == "${appName}"`,
        "--last",
        "1m",
        "--style",
        "compact",
      ],
      { timeoutMs: 5000 },
    );
    if (result.error) return { captured: false, error: result.error.message };
    const lines = limitLogLines((result.stdout ?? "").split("\n"), lineLimit);
    writeFileSync(outputPath, lines.join("\n"));
    return summarizeLogLines(lines);
  }
  captureDeviceInfo(): any {
    const args = this.udid
      ? ["list", "devices"]
      : ["list", "devices", "booted"];
    const result = runXcrunSimctl(args);
    if (result.status !== 0) return {};
    return parseDeviceInfo(result.stdout ?? "");
  }
  captureAll(
    outputDir: any,
    { logLines = 100, appName = null }: any = {},
  ): any {
    const timestamp = formatTimestamp(new Date());
    const captureDir = this.inline
      ? null
      : join(outputDir, `app-state-${timestamp}`);
    if (captureDir) mkdirSync(captureDir, { recursive: true });
    const summary: Record<string, any> = {
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
    } else if (captureDir) {
      const screenshotPath = join(captureDir, "screenshot.png");
      renameSync(screenshotResult.file_path, screenshotPath);
      summary.screenshot = {
        mode: "file",
        file: "screenshot.png",
        size_bytes: screenshotResult.size_bytes,
      };
    }
    if (captureDir) {
      summary.accessibility = this.captureAccessibilityTree(
        join(captureDir, "accessibility-tree.json"),
      );
      if (this.appBundleId)
        summary.logs = this.captureLogs(
          join(captureDir, "app-logs.txt"),
          logLines,
        );
    }
    const deviceInfo = this.captureDeviceInfo();
    if (Object.keys(deviceInfo).length) {
      summary.device = deviceInfo;
      if (captureDir)
        writeFileSync(
          join(captureDir, "device-info.json"),
          `${JSON.stringify(deviceInfo, null, 2)}\n`,
        );
    }
    if (captureDir) {
      writeFileSync(
        join(captureDir, "summary.json"),
        `${JSON.stringify(summary, null, 2)}\n`,
      );
      writeFileSync(
        join(captureDir, "summary.md"),
        createSummaryMarkdown(summary),
      );
    }
    return summary;
  }
}
export function parseDeviceInfo(output: any): any {
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes("iPhone") && !line.includes("iPad")) continue;
    const match = line
      .trim()
      .match(/^(.+?)\s+\(([A-F0-9-]{36})\)\s+\(([^)]+)\)/i);
    if (match)
      return { name: match[1].trim(), udid: match[2], state: match[3].trim() };
    const parts = line.trim().split("(");
    if (parts[0]) return { name: parts[0].trim() };
  }
  return {};
}
export function limitLogLines(lines: any, lineLimit: any = 100): any {
  return lines.length > lineLimit ? lines.slice(-lineLimit) : lines;
}
export function summarizeLogLines(lines: any): any {
  return {
    captured: true,
    lines: lines.length,
    warnings: lines.filter((line: any) =>
      line.toLowerCase().includes("warning"),
    ).length,
    errors: lines.filter((line: any) => line.toLowerCase().includes("error"))
      .length,
  };
}
export function createSummaryMarkdown(summary: any): any {
  const lines: any[] = [
    "# App State Capture",
    "",
    `**Timestamp:** ${summary.timestamp}`,
    "",
  ];
  if (summary.device) {
    lines.push(
      "## Device",
      `- Name: ${summary.device.name ?? "Unknown"}`,
      `- UDID: ${summary.device.udid ?? "N/A"}`,
      `- State: ${summary.device.state ?? "Unknown"}`,
      "",
    );
  }
  lines.push("## Screenshot", "![Current Screen](screenshot.png)", "");
  if (summary.accessibility) {
    lines.push("## Accessibility");
    if (summary.accessibility.captured)
      lines.push(`- Elements: ${summary.accessibility.element_count ?? 0}`);
    else lines.push(`- Error: ${summary.accessibility.error ?? "Unknown"}`);
    lines.push("");
  }
  if (summary.logs) {
    lines.push("## Logs");
    if (summary.logs.captured) {
      lines.push(
        `- Lines: ${summary.logs.lines ?? 0}`,
        `- Warnings: ${summary.logs.warnings ?? 0}`,
        `- Errors: ${summary.logs.errors ?? 0}`,
      );
    } else {
      lines.push(
        `- ${summary.logs.reason ?? summary.logs.error ?? "Not captured"}`,
      );
    }
    lines.push("");
  }
  lines.push(
    "## Files",
    "- `screenshot.png` - Current screen",
    "- `accessibility-tree.json` - Full UI hierarchy",
  );
  if (summary.logs) lines.push("- `app-logs.txt` - Recent app logs");
  lines.push(
    "- `device-info.json` - Device details",
    "- `summary.json` - Complete capture metadata",
    "",
  );
  return lines.join("\n");
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    appBundleId: null,
    output: ".",
    logLines: 100,
    udid: null,
    inline: false,
    size: "half",
    appName: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--inline") args.inline = true;
    else if (
      [
        "--app-bundle-id",
        "--output",
        "--log-lines",
        "--udid",
        "--size",
        "--app-name",
      ].includes(arg)
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
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
  if (!Number.isInteger(args.logLines))
    throw new Error("--log-lines must be an integer");
  if (!["full", "half", "quarter", "thumb"].includes(args.size))
    throw new Error("--size must be one of: full, half, quarter, thumb");
  return args;
}
export function usage(): any {
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
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  let udid;
  try {
    udid = resolveUdid(args.udid);
  } catch (error: any) {
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
    const summary = capturer.captureAll(args.output, {
      logLines: args.logLines,
      appName: args.appName,
    });
    if (summary.output_dir)
      console.log(`State captured: ${summary.output_dir}/`);
    else
      console.log(
        `State captured (inline mode): ${summary.screenshot.width}x${summary.screenshot.height}`,
      );
    if (
      summary.logs?.captured &&
      (summary.logs.errors > 0 || summary.logs.warnings > 0)
    ) {
      console.log(
        `Issues found: ${summary.logs.errors} errors, ${summary.logs.warnings} warnings`,
      );
    }
    if (summary.accessibility?.captured)
      console.log(`Elements: ${summary.accessibility.element_count}`);
    return 0;
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
    return 1;
  }
}
function formatTimestamp(date: any): any {
  const pad = (value: any) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
