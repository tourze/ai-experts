#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { resolveSerial, runAdbCommand } from "./common.mjs";

export const KEYCODES = {
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

export function resolveKeycode(key) {
  const named = KEYCODES[String(key).toLowerCase()];
  if (named) return named;
  const parsed = Number.parseInt(String(key), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

export function encodeAdbText(text) {
  return text.replaceAll("%", "%%").replaceAll(" ", "%s");
}

export function pressKey(serial, key) {
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

export function typeText(serial, text) {
  try {
    runAdbCommand(["shell", "input", "text", encodeAdbText(text)], serial);
    return true;
  } catch {
    return false;
  }
}

function usage() {
  return `Android keyboard input.

Usage: node scripts/keyboard.mjs [--key <key|keycode>] [--text <text>] [options]

Options:
  --key <key>            Key to press (home, back, enter, tab, delete, or keycode)
  --text <text>          Text to type
  --serial, -s <serial>  Device serial
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { key: null, text: null, serial: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (["--key", "--text", "--serial", "-s"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
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

export function main(argv = process.argv.slice(2)) {
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
