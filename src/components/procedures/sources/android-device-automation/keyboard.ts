#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { resolveSerial, runAdbCommand } from "./common";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "android-device-automation-keyboard",
  entry: procedureEntry(import.meta.url),
  description:
    "向 Android 设备发送按键事件或文本输入：支持命名键（home/back/enter/音量等）和原始键码。",
  owners: { skillIds: ["android-device-automation"] },
  target: "scripts/keyboard.mjs",
  runtime: "node",
  params: [
    {
      flag: "--key",
      type: "key-name|keycode",
      description:
        "命名键（home/back/enter/delete/power/volume_up/volume_down 等）或数字键码",
      required: false,
    },
    {
      flag: "--text",
      type: "字符串",
      description: "要输入的文本",
      required: false,
    },
    {
      flag: "--serial",
      type: "字符串",
      description: "目标设备序列号",
      required: false,
    },
  ],

  exampleArgs: { args: ["--key", "home"] },
});

export const KEYCODES: Record<string, any> = {
  home: 3,
  back: 4,
  call: 5,
  endcall: 6,
  enter: 66,
  tab: 61,
  delete: 67,
  power: 26,
  camera: 27,
  volume_up: 24,
  volume_down: 25,
  menu: 82,
  search: 84,
};
export function resolveKeycode(key: any): any {
  const named = KEYCODES[String(key).toLowerCase()];
  if (named) return named;
  const parsed = Number.parseInt(String(key), 10);
  return Number.isInteger(parsed) ? parsed : null;
}
export function encodeAdbText(text: any): any {
  return text.replaceAll("%", "%%").replaceAll(" ", "%s");
}
export function pressKey(serial: any, key: any): any {
  const keycode = resolveKeycode(key);
  if (!keycode) {
    console.log(`Unknown key: ${key}`);
    return false;
  }
  try {
    runAdbCommand(["shell", "input", "keyevent", String(keycode)], serial);
    return true;
  } catch {
    return false;
  }
}
export function typeText(serial: any, text: any): any {
  try {
    runAdbCommand(["shell", "input", "text", encodeAdbText(text)], serial);
    return true;
  } catch {
    return false;
  }
}
function usage(): any {
  return `Android keyboard input.

Usage: node scripts/keyboard.mjs [--key <key|keycode>] [--text <text>] [options]

Options:
  --key <key>            Key to press (home, back, enter, tab, delete, or keycode)
  --text <text>          Text to type
  --serial, -s <serial>  Device serial
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    key: null,
    text: null,
    serial: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (["--key", "--text", "--serial", "-s"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--key") args.key = value;
      if (arg === "--text") args.text = value;
      if (arg === "--serial" || arg === "-s") args.serial = value;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const serial = resolveSerial(args.serial);
  if (args.key) {
    if (!pressKey(serial, args.key)) return 1;
    console.log(`Pressed ${args.key}`);
  } else if (args.text) {
    if (!typeText(serial, args.text)) return 1;
    console.log(`Typed: ${args.text}`);
  } else {
    console.log(usage());
  }
  return 0;
}
