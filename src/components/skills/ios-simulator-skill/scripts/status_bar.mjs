#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { resolveUdid, runCommand } from "./interaction_common.mjs";
import { realpathSync } from "node:fs";

export const PRESETS = {
  clean: {
    time: "9:41",
    dataNetwork: "5g",
    wifiMode: "active",
    batteryState: "charged",
    batteryLevel: 100,
  },
  testing: {
    time: "11:11",
    dataNetwork: "4g",
    wifiMode: "active",
    batteryState: "discharging",
    batteryLevel: 50,
  },
  low_battery: {
    time: "9:41",
    dataNetwork: "5g",
    wifiMode: "active",
    batteryState: "discharging",
    batteryLevel: 20,
  },
  airplane: {
    time: "9:41",
    dataNetwork: "none",
    wifiMode: "failed",
    batteryState: "charged",
    batteryLevel: 100,
  },
};

export class StatusBarController {
  constructor(udid = null) {
    this.udid = udid;
  }

  override(options = {}) {
    return runCommand(buildStatusBarOverrideCommand(this.udid, options)).status === 0;
  }

  clear() {
    return runCommand(["xcrun", "simctl", "status_bar", this.udid || "booted", "clear"]).status === 0;
  }
}

export function buildStatusBarOverrideCommand(udid, { time = null, dataNetwork = null, wifiMode = null, batteryState = null, batteryLevel = null } = {}) {
  const command = ["xcrun", "simctl", "status_bar", udid || "booted", "override"];
  if (time) command.push("--time", time);
  if (dataNetwork) command.push("--dataNetwork", dataNetwork);
  if (wifiMode) command.push("--wifiMode", wifiMode);
  if (batteryState) command.push("--batteryState", batteryState);
  if (batteryLevel != null) command.push("--batteryLevel", String(batteryLevel));
  return command;
}

function usage() {
  return `Override iOS simulator status bar for screenshots and testing.

Usage: node scripts/status_bar.mjs [options]

Options:
  --preset <name>              Preset: clean, testing, low-battery, airplane
  --time <HH:MM>               Override time
  --data-network <type>        none, 1x, 3g, 4g, 5g, lte, lte-a
  --wifi-mode <mode>           active, searching, failed
  --battery-state <state>      charging, charged, discharging
  --battery-level <number>     Battery level 0-100
  --clear                      Clear status bar override
  --udid <udid>                Device UDID
  --help                       Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    preset: null,
    time: null,
    dataNetwork: null,
    wifiMode: null,
    batteryState: null,
    batteryLevel: null,
    clear: false,
    udid: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--clear") args.clear = true;
    else if (["--preset", "--time", "--data-network", "--wifi-mode", "--battery-state", "--battery-level", "--udid"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--preset") args.preset = value;
      if (arg === "--time") args.time = value;
      if (arg === "--data-network") args.dataNetwork = value;
      if (arg === "--wifi-mode") args.wifiMode = value;
      if (arg === "--battery-state") args.batteryState = value;
      if (arg === "--battery-level") args.batteryLevel = Number.parseInt(value, 10);
      if (arg === "--udid") args.udid = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (args.preset && !Object.hasOwn(PRESETS, args.preset)) throw new Error(`unknown preset: ${args.preset}`);
  if (args.batteryLevel !== null && !Number.isInteger(args.batteryLevel)) throw new Error("--battery-level must be an integer");
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const controller = new StatusBarController(resolveUdid(args.udid));
  if (args.clear) {
    if (!controller.clear()) {
      console.log("Failed to clear status bar override");
      return 1;
    }
    console.log("Status bar override cleared - defaults restored");
  } else if (args.preset) {
    const preset = PRESETS[args.preset];
    if (!controller.override(preset)) {
      console.log(`Failed to apply ${args.preset} preset`);
      return 1;
    }
    console.log(`Status bar: ${args.preset} preset applied`);
    console.log(`  Time: ${preset.time}, Network: ${preset.dataNetwork}, Battery: ${preset.batteryLevel}%`);
  } else if (args.time || args.dataNetwork || args.wifiMode || args.batteryState || args.batteryLevel !== null) {
    if (!controller.override(args)) {
      console.log("Failed to override status bar");
      return 1;
    }
    let output = "Status bar override applied:";
    if (args.time) output += ` Time=${args.time}`;
    if (args.dataNetwork) output += ` Network=${args.dataNetwork}`;
    if (args.batteryLevel !== null) output += ` Battery=${args.batteryLevel}%`;
    console.log(output);
  } else {
    console.log(usage());
    return 1;
  }
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
