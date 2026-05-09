#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { resolveUdid, runCommand } from "./interaction_common";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-clipboard",
  entry: procedureEntry(import.meta.url),
  description: "向 iOS 模拟器剪贴板写入文本，支持测试场景追踪和期望行为标记。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/clipboard.mjs",
  runtime: "node",
  params: [
    {
      flag: "--copy",
      type: "字符串",
      description: "要复制到剪贴板的文本（必填）",
      required: true,
    },
    {
      flag: "--udid",
      type: "字符串",
      description: "目标设备 UDID",
      required: false,
    },
    {
      flag: "--test-name",
      type: "字符串",
      description: "测试场景名称用于追踪",
      required: false,
    },
    {
      flag: "--expected",
      type: "字符串",
      description: "粘贴后的预期行为",
      required: false,
    },
  ],

  exampleArgs: { args: ["--copy", "test@example.com"] },
});

export class ClipboardManager {
  udid: any;
  constructor(udid: any = null) {
    this.udid = udid;
  }
  copy(text: any): any {
    const command: any[] = [
      "xcrun",
      "simctl",
      "pbcopy",
      this.udid || "booted",
      text,
    ];
    return runCommand(command).status === 0;
  }
}
function usage(): any {
  return `Copy text to iOS simulator clipboard.

Usage: node scripts/clipboard.mjs --copy <text> [options]

Options:
  --copy <text>          Text to copy to clipboard
  --udid <udid>          Device UDID
  --test-name <name>     Test scenario name for tracking
  --expected <text>      Expected behavior after paste
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    copy: null,
    udid: null,
    testName: null,
    expected: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (["--copy", "--udid", "--test-name", "--expected"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--copy") args.copy = value;
      if (arg === "--udid") args.udid = value;
      if (arg === "--test-name") args.testName = value;
      if (arg === "--expected") args.expected = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.copy) {
    console.error("Error: --copy is required");
    return 1;
  }
  const udid = resolveUdid(args.udid);
  const manager = new ClipboardManager(udid);
  if (!manager.copy(args.copy)) {
    console.log("Failed to copy text to clipboard");
    return 1;
  }
  let output = `Copied: "${args.copy}"`;
  if (args.testName) output += ` (test: ${args.testName})`;
  console.log(output);
  if (args.expected) console.log(`Expected: ${args.expected}`);
  console.log("");
  console.log("Next steps:");
  console.log(
    "1. Tap text field with: node scripts/navigator.mjs --find-type TextField --tap",
  );
  console.log("2. Paste with: node scripts/keyboard.mjs --key return");
  console.log(
    "   Or use Cmd+V gesture with: node scripts/keyboard.mjs --key cmd+v",
  );
  return 0;
}
