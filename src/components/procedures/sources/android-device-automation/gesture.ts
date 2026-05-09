#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { getScreenSize, resolveSerial, runAdbCommand } from "./common";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "android-device-automation-gesture",
  entry: procedureEntry(import.meta.url),
  description:
    "在 Android 设备上执行滑动/滚动手势：根据屏幕尺寸计算坐标，支持上下左右四个方向。",
  owners: { skillIds: ["android-device-automation"] },
  target: "scripts/gesture.mjs",
  runtime: "node",
  params: [
    {
      flag: "--swipe",
      type: "up|down|left|right",
      description: "滑动方向",
      required: false,
    },
    {
      flag: "--scroll",
      type: "up|down|left|right",
      description: "滚动方向（与 --swipe 等价）",
      required: false,
    },
    {
      flag: "--duration",
      type: "数字",
      description: "手势持续时间（毫秒）",
      required: false,
    },
    {
      flag: "--serial",
      type: "字符串",
      description: "目标设备序列号",
      required: false,
    },
  ],

  exampleArgs: { args: ["--swipe", "up"] },
});

export function buildSwipeCommand(
  width: any,
  height: any,
  direction: any,
  duration: any = 300,
): any {
  const wMin = Math.trunc(width * 0.1);
  const wMax = Math.trunc(width * 0.9);
  const hMin = Math.trunc(height * 0.1);
  const hMax = Math.trunc(height * 0.9);
  const centerX = Math.trunc(width / 2);
  const centerY = Math.trunc(height / 2);
  const coordinates = (
    {
      up: [centerX, hMax, centerX, hMin],
      down: [centerX, hMin, centerX, hMax],
      left: [wMax, centerY, wMin, centerY],
      right: [wMin, centerY, wMax, centerY],
    } as Record<string, number[]>
  )[String(direction)];
  if (!coordinates) {
    throw new Error(`Unknown direction: ${direction}`);
  }
  return [
    "shell",
    "input",
    "swipe",
    ...coordinates.map(String),
    String(duration),
  ];
}
export function performSwipe(
  serial: any,
  direction: any,
  duration: any = 300,
): any {
  const [width, height] = getScreenSize(serial);
  runAdbCommand(buildSwipeCommand(width, height, direction, duration), serial);
  console.log(`Swiped ${direction}`);
}
function usage(): any {
  return `Perform gestures on Android.

Usage: node scripts/gesture.mjs [--swipe up|down|left|right] [--scroll up|down|left|right] [options]

Options:
  --swipe <direction>    Swipe direction
  --scroll <direction>   Scroll content in given direction
  --duration <ms>        Duration in milliseconds (default: 300)
  --serial, -s <serial>  Device serial
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    swipe: null,
    scroll: null,
    duration: 300,
    serial: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (["--swipe", "--scroll", "--duration", "--serial", "-s"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--swipe") args.swipe = value;
      if (arg === "--scroll") args.scroll = value;
      if (arg === "--duration") args.duration = Number.parseInt(value, 10);
      if (arg === "--serial" || arg === "-s") args.serial = value;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }
  for (const direction of [args.swipe, args.scroll].filter(Boolean)) {
    if (!["up", "down", "left", "right"].includes(direction)) {
      throw new Error("direction must be one of: up, down, left, right");
    }
  }
  if (!Number.isInteger(args.duration))
    throw new Error("--duration must be an integer");
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const serial = resolveSerial(args.serial);
  if (args.swipe) {
    performSwipe(serial, args.swipe, args.duration);
  } else if (args.scroll) {
    performSwipe(serial, args.scroll, args.duration);
  } else {
    console.log(usage());
  }
  return 0;
}
