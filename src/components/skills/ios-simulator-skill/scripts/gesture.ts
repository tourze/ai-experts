#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import {
  buildIdbCommand,
  getScreenSize,
  parseCoordinatePair,
  resolveUdid,
  runCommand,
  transformScreenshotCoords,
} from "./interaction_common";

export class GestureController {
  constructor(udid = null, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
    this.udid = udid;
    this.sleep = sleep;
    this.screenSize = getScreenSize(udid);
  }

  swipe(direction, distanceRatio = 0.7) {
    const [width, height] = this.screenSize;
    const centerX = Math.trunc(width / 2);
    const centerY = Math.trunc(height / 2);
    const coordinates = buildSwipeCoordinates(width, height, direction, distanceRatio);
    if (!coordinates) return false;
    return this.swipeBetween([coordinates[0], coordinates[1]], [coordinates[2], coordinates[3]]);
  }

  swipeBetween(start, end, duration = 0.3) {
    const command = buildIdbCommand("ui swipe", this.udid, start[0], start[1], end[0], end[1]);
    if (duration !== 0.3) command.push("--duration", String(Math.trunc(duration * 1000)));
    return runCommand(command).status === 0;
  }

  async scroll(direction, amount = 3) {
    for (let index = 0; index < amount; index += 1) {
      if (!this.swipe(direction, 0.3)) return false;
      await this.sleep(200);
    }
    return true;
  }

  async tapAndHold(x, y, duration = 2.0) {
    if (runCommand(buildIdbCommand("ui tap", this.udid, x, y)).status !== 0) return false;
    await this.sleep(duration * 1000);
    return true;
  }

  pinch(direction = "out", center = null) {
    const point = center ?? [Math.trunc(this.screenSize[0] / 2), Math.trunc(this.screenSize[1] / 2)];
    const offset = direction === "out" ? 100 : 50;
    const first = direction === "out" ? [[point[0] - 20, point[1] - 20], [point[0] - offset, point[1] - offset]] : [[point[0] - offset, point[1] - offset], [point[0] - 20, point[1] - 20]];
    const second = direction === "out" ? [[point[0] + 20, point[1] + 20], [point[0] + offset, point[1] + offset]] : [[point[0] + offset, point[1] + offset], [point[0] + 20, point[1] + 20]];
    return this.swipeBetween(first[0], first[1]) && this.swipeBetween(second[0], second[1]);
  }

  dragAndDrop(start, end) {
    return this.swipeBetween(start, end, 1.0);
  }

  refresh() {
    const [width] = this.screenSize;
    return this.swipeBetween([Math.trunc(width / 2), 100], [Math.trunc(width / 2), 400]);
  }
}

export function buildSwipeCoordinates(width, height, direction, distanceRatio = 0.7) {
  const centerX = Math.trunc(width / 2);
  const centerY = Math.trunc(height / 2);
  if (direction === "up") return [centerX, Math.trunc(height * 0.7), centerX, Math.trunc(height * (1 - distanceRatio + 0.3))];
  if (direction === "down") return [centerX, Math.trunc(height * 0.3), centerX, Math.trunc(height * (distanceRatio - 0.3 + 0.3))];
  if (direction === "left") return [Math.trunc(width * 0.8), centerY, Math.trunc(width * (1 - distanceRatio + 0.2)), centerY];
  if (direction === "right") return [Math.trunc(width * 0.2), centerY, Math.trunc(width * (distanceRatio - 0.2 + 0.2)), centerY];
  return null;
}

function usage() {
  return `Perform gestures on iOS simulator.

Usage: node scripts/gesture.mjs [options]

Options:
  --swipe <direction>              Swipe up, down, left, or right
  --swipe-from <x,y>               Custom swipe start coordinates
  --swipe-to <x,y>                 Custom swipe end coordinates
  --scroll <direction>             Scroll up or down
  --scroll-amount <number>         Number of scroll swipes (default: 3)
  --long-press <x,y>               Long press at coordinates
  --duration <seconds>             Long press duration (default: 2.0)
  --pinch <in|out>                 Pinch gesture
  --refresh                        Pull to refresh
  --screenshot-coords              Interpret coordinates as screenshot coordinates
  --screenshot-width <number>      Screenshot width
  --screenshot-height <number>     Screenshot height
  --udid <udid>                    Device UDID
  --help                           Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    swipe: null,
    swipeFrom: null,
    swipeTo: null,
    scroll: null,
    scrollAmount: 3,
    longPress: null,
    duration: 2.0,
    pinch: null,
    refresh: false,
    screenshotCoords: false,
    screenshotWidth: null,
    screenshotHeight: null,
    udid: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--refresh") args.refresh = true;
    else if (arg === "--screenshot-coords") args.screenshotCoords = true;
    else if (
      [
        "--swipe",
        "--swipe-from",
        "--swipe-to",
        "--scroll",
        "--scroll-amount",
        "--long-press",
        "--duration",
        "--pinch",
        "--screenshot-width",
        "--screenshot-height",
        "--udid",
      ].includes(arg)
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--swipe") args.swipe = value;
      if (arg === "--swipe-from") args.swipeFrom = value;
      if (arg === "--swipe-to") args.swipeTo = value;
      if (arg === "--scroll") args.scroll = value;
      if (arg === "--scroll-amount") args.scrollAmount = Number.parseInt(value, 10);
      if (arg === "--long-press") args.longPress = value;
      if (arg === "--duration") args.duration = Number.parseFloat(value);
      if (arg === "--pinch") args.pinch = value;
      if (arg === "--screenshot-width") args.screenshotWidth = Number.parseInt(value, 10);
      if (arg === "--screenshot-height") args.screenshotHeight = Number.parseInt(value, 10);
      if (arg === "--udid") args.udid = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (args.swipe && !["up", "down", "left", "right"].includes(args.swipe)) throw new Error("--swipe must be up, down, left, or right");
  if (args.scroll && !["up", "down"].includes(args.scroll)) throw new Error("--scroll must be up or down");
  if (args.pinch && !["in", "out"].includes(args.pinch)) throw new Error("--pinch must be in or out");
  if (!Number.isInteger(args.scrollAmount)) throw new Error("--scroll-amount must be an integer");
  if (!Number.isFinite(args.duration)) throw new Error("--duration must be a number");
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const udid = resolveUdid(args.udid);
  const controller = new GestureController(udid);

  if (args.swipe) {
    if (!controller.swipe(args.swipe)) {
      console.log(`Failed to swipe ${args.swipe}`);
      return 1;
    }
    console.log(`Swiped ${args.swipe}`);
  } else if (args.swipeFrom && args.swipeTo) {
    let start = parseCoordinatePair(args.swipeFrom, "--swipe-from");
    let end = parseCoordinatePair(args.swipeTo, "--swipe-to");
    if (args.screenshotCoords) {
      if (!args.screenshotWidth || !args.screenshotHeight) {
        console.log("Error: --screenshot-coords requires --screenshot-width and --screenshot-height");
        return 1;
      }
      const [deviceWidth, deviceHeight] = getScreenSize(udid);
      start = transformScreenshotCoords(start[0], start[1], args.screenshotWidth, args.screenshotHeight, deviceWidth, deviceHeight);
      end = transformScreenshotCoords(end[0], end[1], args.screenshotWidth, args.screenshotHeight, deviceWidth, deviceHeight);
      console.log("Transformed screenshot coords to device coords");
    }
    if (!controller.swipeBetween(start, end)) {
      console.log("Failed to swipe");
      return 1;
    }
    console.log(`Swiped from (${start[0]}, ${start[1]}) to (${end[0]}, ${end[1]})`);
  } else if (args.scroll) {
    if (!(await controller.scroll(args.scroll, args.scrollAmount))) {
      console.log(`Failed to scroll ${args.scroll}`);
      return 1;
    }
    console.log(`Scrolled ${args.scroll} (${args.scrollAmount}x)`);
  } else if (args.longPress) {
    const coords = parseCoordinatePair(args.longPress, "--long-press");
    if (!(await controller.tapAndHold(coords[0], coords[1], args.duration))) {
      console.log("Failed to long press");
      return 1;
    }
    console.log(`Long pressed at (${coords[0]}, ${coords[1]}) for ${args.duration}s`);
  } else if (args.pinch) {
    if (!controller.pinch(args.pinch)) {
      console.log(`Failed to pinch ${args.pinch}`);
      return 1;
    }
    console.log(args.pinch === "out" ? "Zoomed in" : "Zoomed out");
  } else if (args.refresh) {
    if (!controller.refresh()) {
      console.log("Failed to refresh");
      return 1;
    }
    console.log("Performed pull to refresh");
  } else {
    console.log(usage());
    return 1;
  }
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
