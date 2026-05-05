#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { buildIdbCommand, resolveUdid, runCommand } from "./interaction_common.mjs";
import { realpathSync } from "node:fs";

export const SPECIAL_KEYS = {
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

export const HARDWARE_BUTTONS = {
  home: "HOME",
  lock: "LOCK",
  "volume-up": "VOLUME_UP",
  "volume-down": "VOLUME_DOWN",
  ringer: "RINGER",
  power: "LOCK",
  screenshot: "SCREENSHOT",
};

export class KeyboardController {
  constructor(udid = null, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
    this.udid = udid;
    this.sleep = sleep;
  }

  async typeText(text, delay = 0) {
    if (delay > 0) {
      for (const character of text) {
        if (!this.typeSingle(character)) return false;
        await this.sleep(delay * 1000);
      }
      return true;
    }
    return this.typeSingle(text);
  }

  typeSingle(text) {
    return runCommand(buildIdbCommand("ui text", this.udid, text)).status === 0;
  }

  async pressKey(key, count = 1) {
    const keyCode = resolveKeyCode(key);
    if (keyCode == null) return false;
    const command = buildIdbCommand("ui key", this.udid, keyCode);
    for (let index = 0; index < count; index += 1) {
      if (runCommand(command).status !== 0) return false;
      if (count > 1) await this.sleep(100);
    }
    return true;
  }

  pressKeySequence(keys) {
    const mappedKeys = [];
    for (const key of keys) {
      const keyCode = resolveKeyCode(key);
      if (keyCode == null) return false;
      mappedKeys.push(keyCode);
    }
    return runCommand(buildIdbCommand("ui key-sequence", this.udid, ...mappedKeys)).status === 0;
  }

  pressHardwareButton(button) {
    const buttonCode = HARDWARE_BUTTONS[button.toLowerCase()];
    if (!buttonCode) return false;
    return runCommand(buildIdbCommand("ui button", this.udid, buttonCode)).status === 0;
  }

  async clearText({ selectAll = true } = {}) {
    if (selectAll) {
      const success = this.pressKeyCombo(["cmd", "a"]);
      if (success) return this.pressKey("delete");
    } else {
      return this.pressKey("delete", 50);
    }
    return false;
  }

  pressKeyCombo(keys) {
    if (keys.includes("cmd") || keys.includes("command")) {
      if (keys.includes("a")) return this.pressKeySequence(["command", "a"]);
      if (keys.includes("c")) return this.pressKeySequence(["command", "c"]);
      if (keys.includes("v")) return this.pressKeySequence(["command", "v"]);
      if (keys.includes("x")) return this.pressKeySequence(["command", "x"]);
    }
    return this.pressKeySequence(keys);
  }

  dismissKeyboard() {
    return this.pressKey("return");
  }
}

export function resolveKeyCode(key) {
  const mapped = SPECIAL_KEYS[String(key).toLowerCase()];
  if (mapped != null) return mapped;
  const parsed = Number.parseInt(String(key), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function usage() {
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

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
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
    else if (["--type", "--key", "--key-sequence", "--count", "--button", "--udid"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
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
  if (!Number.isInteger(args.count)) throw new Error("--count must be an integer");
  if (args.button && !Object.hasOwn(HARDWARE_BUTTONS, args.button)) throw new Error(`unknown hardware button: ${args.button}`);
  return args;
}

export async function main(argv = process.argv.slice(2)) {
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
    console.log(args.slow ? `Typed: "${args.type}" (slowly)` : `Typed: "${args.type}"`);
  } else if (args.key) {
    if (!(await controller.pressKey(args.key, args.count))) {
      console.log(`Failed to press ${args.key}`);
      return 1;
    }
    console.log(args.count > 1 ? `Pressed ${args.key} (${args.count}x)` : `Pressed ${args.key}`);
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

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
