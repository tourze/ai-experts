#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { getScreenSize, resolveSerial, runAdbCommand } from "./common.mjs";

export function buildSwipeCommand(width, height, direction, duration = 300) {
  const wMin = Math.trunc(width * 0.1);
  const wMax = Math.trunc(width * 0.9);
  const hMin = Math.trunc(height * 0.1);
  const hMax = Math.trunc(height * 0.9);
  const centerX = Math.trunc(width / 2);
  const centerY = Math.trunc(height / 2);

  const coordinates = {
    up: [centerX, hMax, centerX, hMin],
    down: [centerX, hMin, centerX, hMax],
    left: [wMax, centerY, wMin, centerY],
    right: [wMin, centerY, wMax, centerY],
  }[direction];

  if (!coordinates) {
    throw new Error(`Unknown direction: ${direction}`);
  }
  return ["shell", "input", "swipe", ...coordinates.map(String), String(duration)];
}

export function performSwipe(serial, direction, duration = 300) {
  const [width, height] = getScreenSize(serial);
  runAdbCommand(buildSwipeCommand(width, height, direction, duration), serial);
  console.log(`Swiped ${direction}`);
}

function usage() {
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

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { swipe: null, scroll: null, duration: 300, serial: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (["--swipe", "--scroll", "--duration", "--serial", "-s"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
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
  if (!Number.isInteger(args.duration)) throw new Error("--duration must be an integer");
  return args;
}

export function main(argv = process.argv.slice(2)) {
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
