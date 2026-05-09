#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { resolveSerial, runAdbCommand } from "./common";
import { encodeAdbText } from "./keyboard";
import { ScreenMapper } from "./screen_mapper";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "android-device-automation-navigator",
  entry: procedureEntry(import.meta.url),
  description:
    "在 Android 屏幕上查找 UI 元素（按文本/resource-id/类名）并执行点击或文本输入。",
  owners: { skillIds: ["android-device-automation"] },
  target: "scripts/navigator.mjs",
  runtime: "node",
  params: [
    {
      flag: "--find-text",
      type: "字符串",
      description: "按文本或 content-desc 查找元素",
      required: false,
    },
    {
      flag: "--find-id",
      type: "字符串",
      description: "按 resource-id 子串查找元素",
      required: false,
    },
    {
      flag: "--find-class",
      type: "字符串",
      description: "按类名子串查找元素",
      required: false,
    },
    {
      flag: "--index",
      type: "数字",
      description: "多匹配时的元素索引",
      required: false,
    },
    {
      flag: "--tap",
      type: "",
      description: "点击找到的元素中心，传此标志即启用",
      required: false,
    },
    {
      flag: "--enter-text",
      type: "字符串",
      description: "向找到的元素输入文本",
      required: false,
    },
    {
      flag: "--tap-at",
      type: "x,y",
      description: "直接点击屏幕坐标（如 500,800）",
      required: false,
    },
    {
      flag: "--serial",
      type: "字符串",
      description: "目标设备序列号",
      required: false,
    },
  ],

  exampleArgs: { args: ["--find-text", "Settings", "--tap"] },
});

export class Navigator {
  mapper: any;
  serial: any;
  constructor(serial: any = null) {
    this.serial = serial;
    this.mapper = new ScreenMapper(serial);
  }
  findElement({
    text = null,
    resourceId = null,
    elementClass = null,
    index = 0,
  }: any = {}): any {
    const analysis = this.mapper.analyze();
    if (analysis.error) return null;
    return findElementInAnalysis(analysis, {
      text,
      resourceId,
      elementClass,
      index,
    });
  }
  tap(x: any, y: any): any {
    try {
      runAdbCommand(
        ["shell", "input", "tap", String(x), String(y)],
        this.serial,
      );
      return true;
    } catch {
      return false;
    }
  }
  enterText(text: any): any {
    try {
      runAdbCommand(
        ["shell", "input", "text", encodeAdbText(text)],
        this.serial,
      );
      return true;
    } catch {
      return false;
    }
  }
}
export function findElementInAnalysis(
  analysis: any,
  { text = null, resourceId = null, elementClass = null, index = 0 }: any = {},
): any {
  const candidates: any[] = [];
  for (const element of analysis.all_elements ?? []) {
    let match = true;
    if (text) {
      const elementText = String(element.text ?? "").toLowerCase();
      const elementDesc = String(element["content-desc"] ?? "").toLowerCase();
      const search = text.toLowerCase();
      if (!elementText.includes(search) && !elementDesc.includes(search)) {
        match = false;
      }
    }
    if (
      resourceId &&
      !String(element["resource-id"] ?? "").includes(resourceId)
    ) {
      match = false;
    }
    if (elementClass && !String(element.class ?? "").includes(elementClass)) {
      match = false;
    }
    if (match) candidates.push(element);
  }
  return index < candidates.length ? candidates[index] : null;
}
function parseTapAt(value: any): any {
  const [xText, yText] = value.split(",");
  const x = Number.parseInt(xText, 10);
  const y = Number.parseInt(yText, 10);
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new Error("--tap-at must use x,y integer coordinates");
  }
  return [x, y];
}
function usage(): any {
  return `Navigate Android apps.

Usage: node scripts/navigator.mjs [find options] [action options]

Find options:
  --find-text <text>     Find element by text or content description
  --find-id <id>         Find element by resource-id
  --find-class <class>   Find element by class name
  --index <number>       Index of match (default: 0)

Action options:
  --tap                  Tap the found element
  --enter-text <text>    Enter text into found element
  --tap-at <x,y>         Tap at coordinates

Options:
  --serial, -s <serial>  Device serial
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    findText: null,
    findId: null,
    findClass: null,
    index: 0,
    tap: false,
    enterText: null,
    tapAt: null,
    serial: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--tap") {
      args.tap = true;
      continue;
    }
    if (
      [
        "--find-text",
        "--find-id",
        "--find-class",
        "--index",
        "--enter-text",
        "--tap-at",
        "--serial",
        "-s",
      ].includes(arg)
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--find-text") args.findText = value;
      if (arg === "--find-id") args.findId = value;
      if (arg === "--find-class") args.findClass = value;
      if (arg === "--index") args.index = Number.parseInt(value, 10);
      if (arg === "--enter-text") args.enterText = value;
      if (arg === "--tap-at") args.tapAt = value;
      if (arg === "--serial" || arg === "-s") args.serial = value;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }
  if (!Number.isInteger(args.index))
    throw new Error("--index must be an integer");
  return args;
}
export async function main(
  argv: readonly string[],
  sleep: any = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<any> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const serial = resolveSerial(args.serial);
  const navigator = new Navigator(serial);
  if (args.tapAt) {
    const [x, y] = parseTapAt(args.tapAt);
    if (!navigator.tap(x, y)) return 1;
    console.log(`Tapped at ${x},${y}`);
    return 0;
  }
  if (args.findText || args.findId || args.findClass) {
    const element = navigator.findElement({
      text: args.findText,
      resourceId: args.findId,
      elementClass: args.findClass,
      index: args.index,
    });
    if (!element) {
      console.log("Element not found");
      return 1;
    }
    console.log(
      `Found: ${element.class} '${element.text}' at ${JSON.stringify(element.bounds)}`,
    );
    if (args.tap) {
      const bounds = element.bounds;
      if (!bounds) {
        console.log("Element has no bounds");
        return 1;
      }
      const cx = bounds.center_x;
      const cy = bounds.center_y;
      if (!navigator.tap(cx, cy)) {
        console.log("Failed to tap");
        return 1;
      }
      console.log(`Tapped at ${cx},${cy}`);
    }
    if (args.enterText) {
      if (args.tap) await sleep(500);
      if (!navigator.enterText(args.enterText)) {
        console.log("Failed to enter text");
        return 1;
      }
      console.log(`Entered text: ${args.enterText}`);
    }
  } else {
    console.log(usage());
  }
  return 0;
}
