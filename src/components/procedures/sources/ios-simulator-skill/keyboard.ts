#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { buildIdbCommand, resolveUdid, runCommand } from "./interaction_common";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-keyboard",
  entry: procedureEntry(import.meta.url),
  description:
    "向 iOS 模拟器发送按键事件和文本输入：支持命名键、组合键、硬件按钮、清除文本和关闭键盘。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/keyboard.mjs",
  runtime: "node",
  params: [
    {
      flag: "--type",
      type: "字符串",
      description: "向当前焦点输入文本",
      required: false,
    },
    {
      flag: "--slow",
      type: "",
      description: "逐字符慢速输入，传此标志即启用",
      required: false,
    },
    {
      flag: "--key",
      type: "字符串",
      description: "发送特殊键（return/delete/tab/space/方向键等）",
      required: false,
    },
    {
      flag: "--key-sequence",
      type: "字符串",
      description: "发送逗号分隔的按键序列",
      required: false,
    },
    {
      flag: "--count",
      type: "数字",
      description: "按键次数（默认 1）",
      required: false,
    },
    {
      flag: "--button",
      type: "字符串",
      description:
        "按下硬件按钮（home/lock/volume-up/volume-down/power/screenshot）",
      required: false,
    },
    {
      flag: "--clear",
      type: "",
      description: "清除当前文本字段，传此标志即启用",
      required: false,
    },
    { flag: "--dismiss", type: "", description: "关闭键盘", required: false },
    {
      flag: "--udid",
      type: "字符串",
      description: "目标设备 UDID",
      required: false,
    },
  ],

  exampleArgs: { args: ["--key", "home"] },
});

export const SPECIAL_KEYS: Record<string, any> = {
  return: 40,
  enter: 40,
  delete: 42,
  backspace: 42,
  tab: 43,
  space: 44,
  escape: 41,
  up: 82,
  down: 81,
  left: 80,
  right: 79,
};
export const HARDWARE_BUTTONS: Record<string, any> = {
  home: "HOME",
  lock: "LOCK",
  "volume-up": "VOLUME_UP",
  "volume-down": "VOLUME_DOWN",
  ringer: "RINGER",
  power: "LOCK",
  screenshot: "SCREENSHOT",
};
export class KeyboardController {
  sleep: any;
  udid: any;
  constructor(
    udid: any = null,
    sleep: any = (ms: any): any =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    this.udid = udid;
    this.sleep = sleep;
  }
  async typeText(text: any, delay: any = 0): Promise<any> {
    if (delay > 0) {
      for (const character of text) {
        if (!this.typeSingle(character)) return false;
        await this.sleep(delay * 1000);
      }
      return true;
    }
    return this.typeSingle(text);
  }
  typeSingle(text: any): any {
    return runCommand(buildIdbCommand("ui text", this.udid, text)).status === 0;
  }
  async pressKey(key: any, count: any = 1): Promise<any> {
    const keyCode = resolveKeyCode(key);
    if (keyCode == null) return false;
    const command = buildIdbCommand("ui key", this.udid, keyCode);
    for (let index = 0; index < count; index += 1) {
      if (runCommand(command).status !== 0) return false;
      if (count > 1) await this.sleep(100);
    }
    return true;
  }
  pressKeySequence(keys: any): any {
    const mappedKeys: any[] = [];
    for (const key of keys) {
      const keyCode = resolveKeyCode(key);
      if (keyCode == null) return false;
      mappedKeys.push(keyCode);
    }
    return (
      runCommand(buildIdbCommand("ui key-sequence", this.udid, ...mappedKeys))
        .status === 0
    );
  }
  pressHardwareButton(button: any): any {
    const buttonCode = HARDWARE_BUTTONS[button.toLowerCase()];
    if (!buttonCode) return false;
    return (
      runCommand(buildIdbCommand("ui button", this.udid, buttonCode)).status ===
      0
    );
  }
  async clearText({ selectAll = true }: any = {}): Promise<any> {
    if (selectAll) {
      const success = this.pressKeyCombo(["cmd", "a"]);
      if (success) return this.pressKey("delete");
    } else {
      return this.pressKey("delete", 50);
    }
    return false;
  }
  pressKeyCombo(keys: any): any {
    if (keys.includes("cmd") || keys.includes("command")) {
      if (keys.includes("a")) return this.pressKeySequence(["command", "a"]);
      if (keys.includes("c")) return this.pressKeySequence(["command", "c"]);
      if (keys.includes("v")) return this.pressKeySequence(["command", "v"]);
      if (keys.includes("x")) return this.pressKeySequence(["command", "x"]);
    }
    return this.pressKeySequence(keys);
  }
  dismissKeyboard(): any {
    return this.pressKey("return");
  }
}
export function resolveKeyCode(key: any): any {
  const mapped = SPECIAL_KEYS[String(key).toLowerCase()];
  if (mapped != null) return mapped;
  const parsed = Number.parseInt(String(key), 10);
  return Number.isInteger(parsed) ? parsed : null;
}
function usage(): any {
  return `Control keyboard and hardware buttons.

Usage: node scripts/keyboard.mjs [options]

Options:
  --type <text>          Type text into current focus
  --slow                 Type slowly character by character
  --key <key>            Press special key
  --key-sequence <list>  Press comma-separated key sequence
  --count <number>       Number of key presses (default: 1)
  --button <button>      Press hardware button
  --clear                Clear current text field
  --dismiss              Dismiss keyboard
  --udid <udid>          Device UDID
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    type: null,
    slow: false,
    key: null,
    keySequence: null,
    count: 1,
    button: null,
    clear: false,
    dismiss: false,
    udid: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--slow") args.slow = true;
    else if (arg === "--clear") args.clear = true;
    else if (arg === "--dismiss") args.dismiss = true;
    else if (
      [
        "--type",
        "--key",
        "--key-sequence",
        "--count",
        "--button",
        "--udid",
      ].includes(arg)
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--type") args.type = value;
      if (arg === "--key") args.key = value;
      if (arg === "--key-sequence") args.keySequence = value;
      if (arg === "--count") args.count = Number.parseInt(value, 10);
      if (arg === "--button") args.button = value;
      if (arg === "--udid") args.udid = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.count))
    throw new Error("--count must be an integer");
  if (args.button && !Object.hasOwn(HARDWARE_BUTTONS, args.button))
    throw new Error(`unknown hardware button: ${args.button}`);
  return args;
}
export async function main(argv: readonly string[]): Promise<any> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const udid = resolveUdid(args.udid);
  const controller = new KeyboardController(udid);
  if (args.type) {
    const delay = args.slow ? 0.1 : 0;
    if (!(await controller.typeText(args.type, delay))) {
      console.log("Failed to type text");
      return 1;
    }
    console.log(
      args.slow ? `Typed: "${args.type}" (slowly)` : `Typed: "${args.type}"`,
    );
  } else if (args.key) {
    if (!(await controller.pressKey(args.key, args.count))) {
      console.log(`Failed to press ${args.key}`);
      return 1;
    }
    console.log(
      args.count > 1
        ? `Pressed ${args.key} (${args.count}x)`
        : `Pressed ${args.key}`,
    );
  } else if (args.keySequence) {
    const keys = args.keySequence.split(",");
    if (!controller.pressKeySequence(keys)) {
      console.log("Failed to press key sequence");
      return 1;
    }
    console.log(`Pressed sequence: ${keys.join(" -> ")}`);
  } else if (args.button) {
    if (!controller.pressHardwareButton(args.button)) {
      console.log(`Failed to press ${args.button}`);
      return 1;
    }
    console.log(`Pressed ${args.button} button`);
  } else if (args.clear) {
    if (!(await controller.clearText())) {
      console.log("Failed to clear text");
      return 1;
    }
    console.log("Cleared text field");
  } else if (args.dismiss) {
    if (!(await controller.dismissKeyboard())) {
      console.log("Failed to dismiss keyboard");
      return 1;
    }
    console.log("Dismissed keyboard");
  } else {
    console.log(usage());
    return 1;
  }
  return 0;
}
