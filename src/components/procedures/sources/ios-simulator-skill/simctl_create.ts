#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { jsonLine, runXcrunSimctl } from "./simctl_common";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-simctl-create",
  entry: procedureEntry(import.meta.url),
  description:
    "动态创建 iOS 模拟器：选择设备类型和 iOS 版本，支持列出可用设备类型和 runtime。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/simctl_create.mjs",
  runtime: "node",
  params: [
    {
      flag: "--device",
      type: "字符串",
      description: "设备类型（如 iPhone 16 Pro）",
      required: false,
    },
    {
      flag: "--runtime",
      type: "字符串",
      description: "iOS 版本（默认最新）",
      required: false,
    },
    {
      flag: "--name",
      type: "字符串",
      description: "自定义模拟器名称",
      required: false,
    },
    {
      flag: "--list-devices",
      type: "",
      description: "列出可用设备类型",
      required: false,
    },
    {
      flag: "--list-runtimes",
      type: "",
      description: "列出可用 iOS runtime",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "输出为 JSON，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--device", "iPhone 16 Pro", "--runtime", "18.0"] },
});

export class SimulatorCreator {
  create({ deviceType, iosVersion = null, customName = null }: any): any {
    const availableTypes = this.getDeviceTypes();
    if (!availableTypes.length)
      return [false, "Failed to get available device types", null];
    const matchedType = availableTypes.find((device: any) =>
      device.name.toLowerCase().includes(deviceType.toLowerCase()),
    );
    if (!matchedType) {
      return [
        false,
        `Device type '${deviceType}' not found. Use --list-devices for available types.`,
        null,
      ];
    }
    const runtimes = this.getRuntimes();
    if (!runtimes.length)
      return [false, "Failed to get available runtimes", null];
    let runtime: any = null;
    if (iosVersion) {
      runtime = runtimes.find((candidate: any) =>
        candidate.name.includes(iosVersion),
      );
      if (!runtime) {
        return [
          false,
          `iOS version '${iosVersion}' not found. Use --list-runtimes for available versions.`,
          null,
        ];
      }
    } else {
      runtime = runtimes.at(-1);
    }
    if (!runtime) return [false, "No iOS runtime available", null];
    const deviceName =
      customName ||
      `${matchedType.identifier.split(".").at(-1)}-${iosVersion || "latest"}`;
    const result = runXcrunSimctl(
      ["create", deviceName, matchedType.identifier, runtime.identifier],
      { timeoutMs: 60000 },
    );
    if (result.error?.code === "ETIMEDOUT")
      return [false, "Creation command timed out", null];
    if (result.status !== 0) {
      return [
        false,
        `Creation failed: ${(result.stderr || result.stdout || "").trim()}`,
        null,
      ];
    }
    const newUdid = (result.stdout ?? "").trim();
    return [
      true,
      `Device created: ${deviceName} (${deviceType}) iOS ${iosVersion || "latest"} UDID: ${newUdid}`,
      newUdid,
    ];
  }
  getDeviceTypes(): any {
    const result = runXcrunSimctl(["list", "devicetypes", "-j"], {
      timeoutMs: 30000,
    });
    if (result.status !== 0) return [];
    return parseDeviceTypes(JSON.parse(result.stdout));
  }
  getRuntimes(): any {
    const result = runXcrunSimctl(["list", "runtimes", "-j"], {
      timeoutMs: 30000,
    });
    if (result.status !== 0) return [];
    return parseRuntimes(JSON.parse(result.stdout));
  }
}
export function parseDeviceTypes(data: any): any {
  return (data.devicetypes ?? []).map((device: any) => ({
    name: device.name ?? "",
    identifier: device.identifier ?? "",
  }));
}
export function parseRuntimes(data: any): any {
  return (data.runtimes ?? [])
    .filter(
      (runtime: any) =>
        String(runtime.identifier ?? "").includes("iOS") ||
        String(runtime.name ?? "").includes("iOS"),
    )
    .map((runtime: any) => ({
      name: runtime.name ?? "",
      identifier: runtime.identifier ?? "",
    }))
    .sort((left: any, right: any) =>
      right.identifier.localeCompare(left.identifier),
    );
}
function usage(): any {
  return `Create iOS simulators dynamically.

Usage: node scripts/simctl_create.mjs [options]

Options:
  --device <type>        Device type (e.g. iPhone 16 Pro)
  --runtime <version>    iOS version (defaults to latest)
  --name <name>          Custom simulator name
  --list-devices         List available device types
  --list-runtimes        List available iOS runtimes
  --json                 Output as JSON
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    device: null,
    runtime: null,
    name: null,
    listDevices: false,
    listRuntimes: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--list-devices") args.listDevices = true;
    else if (arg === "--list-runtimes") args.listRuntimes = true;
    else if (arg === "--json") args.json = true;
    else if (["--device", "--runtime", "--name"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--device") args.device = value;
      if (arg === "--runtime") args.runtime = value;
      if (arg === "--name") args.name = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const creator = new SimulatorCreator();
  if (args.listDevices) {
    const devices = creator.getDeviceTypes();
    if (args.json) console.log(jsonLine({ devices }));
    else {
      console.log(`Available device types (${devices.length}):`);
      for (const device of devices.slice(0, 20))
        console.log(`  - ${device.name}`);
      if (devices.length > 20)
        console.log(`  ... and ${devices.length - 20} more`);
    }
    return 0;
  }
  if (args.listRuntimes) {
    const runtimes = creator.getRuntimes();
    if (args.json) console.log(jsonLine({ runtimes }));
    else {
      console.log(`Available iOS runtimes (${runtimes.length}):`);
      for (const runtime of runtimes) console.log(`  - ${runtime.name}`);
    }
    return 0;
  }
  if (!args.device) {
    console.error(
      "Error: Specify --device, --list-devices, or --list-runtimes",
    );
    return 1;
  }
  const [success, message, newUdid] = creator.create({
    deviceType: args.device,
    iosVersion: args.runtime,
    customName: args.name,
  });
  if (args.json) {
    console.log(
      jsonLine({
        action: "create",
        device_type: args.device,
        runtime: args.runtime,
        success,
        message,
        new_udid: newUdid,
      }),
    );
  } else {
    console.log(message);
  }
  return success ? 0 : 1;
}
