#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { resolveUdid, runCommand } from "./interaction_common";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-status-bar",
  entry: procedureEntry(import.meta.url),
  description:
    "覆盖 iOS 模拟器状态栏：支持预设（clean/testing/low-battery/airplane）和自定义时间、网络、电池。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/status_bar.mjs",
  runtime: "node",
  params: [
    {
      flag: "--preset",
      type: "字符串",
      description: "预设：clean, testing, low-battery, airplane",
      required: false,
    },
    {
      flag: "--time",
      type: "字符串",
      description: "覆盖状态栏时间",
      required: false,
    },
    {
      flag: "--data-network",
      type: "字符串",
      description: "数据网络：none, 1x, 3g, 4g, 5g, lte, lte-a",
      required: false,
    },
    {
      flag: "--wifi-mode",
      type: "字符串",
      description: "WiFi 模式：active, searching, failed",
      required: false,
    },
    {
      flag: "--battery-state",
      type: "字符串",
      description: "电池状态：charging, charged, discharging",
      required: false,
    },
    {
      flag: "--battery-level",
      type: "数字",
      description: "电池电量 0-100",
      required: false,
    },
    {
      flag: "--clear",
      type: "",
      description: "清除状态栏覆盖，传此标志即启用",
      required: false,
    },
    {
      flag: "--udid",
      type: "字符串",
      description: "目标设备 UDID",
      required: false,
    },
  ],

  exampleArgs: { args: ["--preset", "clean"] },
});

export const PRESETS: Record<string, any> = {
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
  udid: any;
  constructor(udid: any = null) {
    this.udid = udid;
  }
  override(options: any = {}): any {
    return (
      runCommand(buildStatusBarOverrideCommand(this.udid, options)).status === 0
    );
  }
  clear(): any {
    return (
      runCommand([
        "xcrun",
        "simctl",
        "status_bar",
        this.udid || "booted",
        "clear",
      ]).status === 0
    );
  }
}
export function buildStatusBarOverrideCommand(
  udid: any,
  {
    time = null,
    dataNetwork = null,
    wifiMode = null,
    batteryState = null,
    batteryLevel = null,
  }: any = {},
): any {
  const command: any[] = [
    "xcrun",
    "simctl",
    "status_bar",
    udid || "booted",
    "override",
  ];
  if (time) command.push("--time", time);
  if (dataNetwork) command.push("--dataNetwork", dataNetwork);
  if (wifiMode) command.push("--wifiMode", wifiMode);
  if (batteryState) command.push("--batteryState", batteryState);
  if (batteryLevel != null)
    command.push("--batteryLevel", String(batteryLevel));
  return command;
}
function usage(): any {
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
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
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
    else if (
      [
        "--preset",
        "--time",
        "--data-network",
        "--wifi-mode",
        "--battery-state",
        "--battery-level",
        "--udid",
      ].includes(arg)
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--preset") args.preset = value;
      if (arg === "--time") args.time = value;
      if (arg === "--data-network") args.dataNetwork = value;
      if (arg === "--wifi-mode") args.wifiMode = value;
      if (arg === "--battery-state") args.batteryState = value;
      if (arg === "--battery-level")
        args.batteryLevel = Number.parseInt(value, 10);
      if (arg === "--udid") args.udid = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (args.preset && !Object.hasOwn(PRESETS, args.preset))
    throw new Error(`unknown preset: ${args.preset}`);
  if (args.batteryLevel !== null && !Number.isInteger(args.batteryLevel))
    throw new Error("--battery-level must be an integer");
  return args;
}
export function main(argv: readonly string[]): any {
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
    console.log(
      `  Time: ${preset.time}, Network: ${preset.dataNetwork}, Battery: ${preset.batteryLevel}%`,
    );
  } else if (
    args.time ||
    args.dataNetwork ||
    args.wifiMode ||
    args.batteryState ||
    args.batteryLevel !== null
  ) {
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
