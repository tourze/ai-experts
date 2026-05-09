#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import {
  buildIdbCommand,
  flattenTree,
  getAccessibilityTree,
  getScreenSize,
  parseCoordinatePair,
  resolveUdid,
  runCommand,
  transformScreenshotCoords,
} from "./interaction_common";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-navigator",
  entry: procedureEntry(import.meta.url),
  description:
    "基于无障碍树导航 iOS 应用界面：按文本、类型或标识符查找元素，支持点击和文本输入。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/navigator.mjs",
  runtime: "node",
  params: [
    {
      flag: "--find-text",
      type: "字符串",
      description: "按文本模糊匹配查找元素",
      required: false,
    },
    {
      flag: "--find-exact",
      type: "字符串",
      description: "按精确文本查找元素",
      required: false,
    },
    {
      flag: "--find-type",
      type: "字符串",
      description: "元素类型（Button/TextField/Link 等）",
      required: false,
    },
    {
      flag: "--find-id",
      type: "字符串",
      description: "无障碍标识符",
      required: false,
    },
    {
      flag: "--index",
      type: "数字",
      description: "多匹配时的元素索引（默认 0）",
      required: false,
    },
    {
      flag: "--tap",
      type: "",
      description: "点击找到的元素，传此标志即启用",
      required: false,
    },
    {
      flag: "--tap-at",
      type: "x,y",
      description: "直接点击屏幕坐标",
      required: false,
    },
    {
      flag: "--enter-text",
      type: "字符串",
      description: "向找到的 TextField 输入文本",
      required: false,
    },
    {
      flag: "--screenshot-coords",
      type: "",
      description: "将点击坐标解释为截图坐标，传此标志即启用",
      required: false,
    },
    {
      flag: "--screenshot-width",
      type: "数字",
      description: "截图宽度",
      required: false,
    },
    {
      flag: "--screenshot-height",
      type: "数字",
      description: "截图高度",
      required: false,
    },
    {
      flag: "--list",
      type: "",
      description: "列出当前屏幕上的可点击元素",
      required: false,
    },
    {
      flag: "--udid",
      type: "字符串",
      description: "目标设备 UDID",
      required: false,
    },
  ],

  exampleArgs: { args: ["--find-text", "Settings", "--tap"] },
});

export class Element {
  enabled: any;
  frame: any;
  identifier: any;
  label: any;
  traits: any;
  type: any;
  value: any;
  constructor(node: any) {
    this.type = node.type ?? "Unknown";
    this.label = node.AXLabel ?? null;
    this.value = node.AXValue ?? null;
    this.identifier = node.AXUniqueId ?? null;
    this.frame = node.frame ?? {};
    this.traits = node.traits ?? [];
    this.enabled = node.enabled ?? true;
  }
  get center(): any {
    const x = Math.trunc(
      Number(this.frame.x ?? 0) + Number(this.frame.width ?? 0) / 2,
    );
    const y = Math.trunc(
      Number(this.frame.y ?? 0) + Number(this.frame.height ?? 0) / 2,
    );
    return [x, y];
  }
  get description(): any {
    const label = this.label || this.value || this.identifier || "Unnamed";
    return `${this.type} "${label}"`;
  }
}
export class Navigator {
  sleep: any;
  treeCache: any;
  udid: any;
  constructor(
    udid: any = null,
    sleep: any = (ms: any): any =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    this.udid = udid;
    this.sleep = sleep;
    this.treeCache = null;
  }
  getAccessibilityTree({ forceRefresh = false }: any = {}): any {
    if (this.treeCache && !forceRefresh) return this.treeCache;
    this.treeCache = getAccessibilityTree(this.udid, { nested: true });
    return this.treeCache;
  }
  listElements({ forceRefresh = false }: any = {}): any {
    return flattenTree(this.getAccessibilityTree({ forceRefresh }))
      .filter((node: any) => node.type)
      .map((node: any) => new Element(node));
  }
  findElement({
    text = null,
    elementType = null,
    identifier = null,
    index = 0,
    fuzzy = true,
  }: any = {}): any {
    const matches: any[] = [];
    for (const element of this.listElements()) {
      if (!element.enabled) continue;
      if (elementType && element.type !== elementType) continue;
      if (identifier && element.identifier !== identifier) continue;
      if (text) {
        const elementText = `${element.label || ""} ${element.value || ""}`;
        if (fuzzy) {
          if (!elementText.toLowerCase().includes(text.toLowerCase())) continue;
        } else if (text !== element.label && text !== element.value) {
          continue;
        }
      }
      matches.push(element);
    }
    return index < matches.length ? matches[index] : null;
  }
  tap(element: any): any {
    const [x, y] = element.center;
    return this.tapAt(x, y);
  }
  tapAt(x: any, y: any): any {
    return runCommand(buildIdbCommand("ui tap", this.udid, x, y)).status === 0;
  }
  async enterText(text: any, element: any = null): Promise<any> {
    if (element) {
      if (!this.tap(element)) return false;
      await this.sleep(500);
    }
    return runCommand(buildIdbCommand("ui text", this.udid, text)).status === 0;
  }
  findAndTap(criteria: any): any {
    const element = this.findElement(criteria);
    if (!element) return [false, `Not found: ${formatCriteria(criteria)}`];
    if (this.tap(element))
      return [
        true,
        `Tapped: ${element.description} at (${element.center[0]}, ${element.center[1]})`,
      ];
    return [false, `Failed to tap: ${element.description}`];
  }
  async findAndEnterText({
    textToEnter,
    findText = null,
    elementType = "TextField",
    identifier = null,
    index = 0,
  }: any = {}): Promise<any> {
    const element = this.findElement({
      text: findText,
      elementType,
      identifier,
      index,
    });
    if (!element) return [false, "TextField not found"];
    if (await this.enterText(textToEnter, element))
      return [true, `Entered text in: ${element.description}`];
    return [false, "Failed to enter text"];
  }
}
function formatCriteria({
  text = null,
  elementType = null,
  identifier = null,
}: any = {}): any {
  const criteria: any[] = [];
  if (text) criteria.push(`text='${text}'`);
  if (elementType) criteria.push(`type=${elementType}`);
  if (identifier) criteria.push(`id=${identifier}`);
  return criteria.join(", ");
}
function usage(): any {
  return `Navigate iOS apps using accessibility data.

Usage: node scripts/navigator.mjs [find options] [action options]

Find options:
  --find-text <text>          Find element by text fuzzy match
  --find-exact <text>         Find element by exact text
  --find-type <type>          Element type
  --find-id <id>              Accessibility identifier
  --index <number>            Match index (default: 0)

Action options:
  --tap                       Tap found element
  --tap-at <x,y>              Tap coordinates
  --enter-text <text>         Enter text into element
  --screenshot-coords         Interpret tap coords as screenshot coords
  --screenshot-width <number> Screenshot width
  --screenshot-height <num>   Screenshot height
  --list                      List tappable elements
  --udid <udid>               Device UDID
  --help                      Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    findText: null,
    findExact: null,
    findType: null,
    findId: null,
    index: 0,
    tap: false,
    tapAt: null,
    enterText: null,
    screenshotCoords: false,
    screenshotWidth: null,
    screenshotHeight: null,
    udid: null,
    list: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--tap") args.tap = true;
    else if (arg === "--screenshot-coords") args.screenshotCoords = true;
    else if (arg === "--list") args.list = true;
    else if (
      [
        "--find-text",
        "--find-exact",
        "--find-type",
        "--find-id",
        "--index",
        "--tap-at",
        "--enter-text",
        "--screenshot-width",
        "--screenshot-height",
        "--udid",
      ].includes(arg)
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--find-text") args.findText = value;
      if (arg === "--find-exact") args.findExact = value;
      if (arg === "--find-type") args.findType = value;
      if (arg === "--find-id") args.findId = value;
      if (arg === "--index") args.index = Number.parseInt(value, 10);
      if (arg === "--tap-at") args.tapAt = value;
      if (arg === "--enter-text") args.enterText = value;
      if (arg === "--screenshot-width")
        args.screenshotWidth = Number.parseInt(value, 10);
      if (arg === "--screenshot-height")
        args.screenshotHeight = Number.parseInt(value, 10);
      if (arg === "--udid") args.udid = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.index))
    throw new Error("--index must be an integer");
  return args;
}
export async function main(argv: readonly string[]): Promise<any> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const udid = resolveUdid(args.udid);
  const navigator = new Navigator(udid);
  if (args.list) {
    const tappable = navigator
      .listElements()
      .filter(
        (element: any) =>
          element.enabled &&
          ["Button", "Link", "Cell", "TextField", "SecureTextField"].includes(
            element.type,
          ),
      );
    console.log(`Tappable elements (${tappable.length}):`);
    for (const element of tappable.slice(0, 10)) {
      console.log(
        `  ${element.type}: "${element.label || element.value || "Unnamed"}" (${element.center[0]}, ${element.center[1]})`,
      );
    }
    if (tappable.length > 10)
      console.log(`  ... and ${tappable.length - 10} more`);
    return 0;
  }
  if (args.tapAt) {
    let [x, y] = parseCoordinatePair(args.tapAt, "--tap-at");
    if (args.screenshotCoords) {
      if (!args.screenshotWidth || !args.screenshotHeight) {
        console.log(
          "Error: --screenshot-coords requires --screenshot-width and --screenshot-height",
        );
        return 1;
      }
      const [deviceWidth, deviceHeight] = getScreenSize(udid);
      [x, y] = transformScreenshotCoords(
        x,
        y,
        args.screenshotWidth,
        args.screenshotHeight,
        deviceWidth,
        deviceHeight,
      );
      console.log(
        `Transformed screenshot coords (${args.tapAt}) to device coords (${x}, ${y})`,
      );
    }
    if (!navigator.tapAt(x, y)) {
      console.log(`Failed to tap at (${x}, ${y})`);
      return 1;
    }
    console.log(`Tapped at (${x}, ${y})`);
    return 0;
  }
  const text = args.findText || args.findExact;
  const fuzzy = args.findText != null;
  if (args.tap) {
    const [success, message] = navigator.findAndTap({
      text,
      elementType: args.findType,
      identifier: args.findId,
      index: args.index,
      fuzzy,
    });
    console.log(message);
    return success ? 0 : 1;
  }
  if (args.enterText) {
    const [success, message] = await navigator.findAndEnterText({
      textToEnter: args.enterText,
      findText: text,
      elementType: args.findType || "TextField",
      identifier: args.findId,
      index: args.index,
    });
    console.log(message);
    return success ? 0 : 1;
  }
  const element = navigator.findElement({
    text,
    elementType: args.findType,
    identifier: args.findId,
    index: args.index,
    fuzzy,
  });
  if (!element) {
    console.log("Element not found");
    return 1;
  }
  console.log(
    `Found: ${element.description} at (${element.center[0]}, ${element.center[1]})`,
  );
  return 0;
}
