#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  jsonLine,
  listSimulators,
  resolveDeviceIdentifier,
  runXcrunSimctl,
} from "./simctl_common";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-simctl-delete",
  entry: procedureEntry(import.meta.url),
  description:
    "永久删除 iOS 模拟器：支持单设备删除、全部删除、按类型删除和清理旧版本。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/simctl_delete.mjs",
  runtime: "node",
  params: [
    {
      flag: "--udid",
      type: "字符串",
      description: "设备 UDID 或名称",
      required: false,
    },
    {
      flag: "--name",
      type: "字符串",
      description: "设备名称",
      required: false,
    },
    {
      flag: "--yes",
      type: "",
      description: "跳过确认提示，传此标志即启用",
      required: false,
    },
    { flag: "--all", type: "", description: "删除所有模拟器", required: false },
    {
      flag: "--type",
      type: "字符串",
      description: "删除指定类型的所有模拟器",
      required: false,
    },
    {
      flag: "--old",
      type: "数字",
      description: "每种类型保留 N 个最新，删除其余",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "输出为 JSON，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--old", "3"] },
});

export class SimulatorDeleter {
  udid: any;
  constructor(udid: any = null) {
    this.udid = udid;
  }
  delete({ confirm = false }: any = {}): any {
    if (!this.udid) return [false, "Error: Device UDID not specified"];
    if (
      !confirm &&
      !readConfirmation(
        `Permanently delete simulator ${this.udid}? (type 'yes' to confirm): `,
      )
    ) {
      return [false, "Deletion cancelled by user"];
    }
    const result = runXcrunSimctl(["delete", this.udid], { timeoutMs: 60000 });
    if (result.error?.code === "ETIMEDOUT")
      return [false, "Deletion command timed out"];
    if (result.status !== 0)
      return [
        false,
        `Deletion failed: ${(result.stderr || result.stdout || "").trim()}`,
      ];
    return [true, `Device deleted: ${this.udid} [disk space freed]`];
  }
  static deleteAll({ confirm = false }: any = {}): any {
    const simulators = listSimulators(null);
    if (
      !confirm &&
      !readConfirmation(
        `Permanently delete ALL ${simulators.length} simulators? (type 'yes' to confirm): `,
      )
    ) {
      return [0, simulators.length];
    }
    return deleteMany(simulators);
  }
  static deleteByType(deviceType: any, { confirm = false }: any = {}): any {
    const matching = listSimulators(null).filter((sim: any) =>
      sim.name.toLowerCase().includes(deviceType.toLowerCase()),
    );
    if (!matching.length) return [0, 0];
    if (
      !confirm &&
      !readConfirmation(
        `Permanently delete ${matching.length} ${deviceType} simulators? (type 'yes' to confirm): `,
      )
    ) {
      return [0, matching.length];
    }
    return deleteMany(matching);
  }
  static deleteOld({ keepCount = 3, confirm = false }: any = {}): any {
    const byType = new Map();
    for (const sim of listSimulators(null)) {
      if (!byType.has(sim.type)) byType.set(sim.type, []);
      byType.get(sim.type).push(sim);
    }
    const toDelete: any[] = [];
    for (const sims of byType.values()) {
      const sorted = [...sims].sort((left: any, right: any) =>
        right.runtime.localeCompare(left.runtime),
      );
      toDelete.push(...sorted.slice(keepCount));
    }
    if (!toDelete.length) return [0, 0];
    if (
      !confirm &&
      !readConfirmation(
        `Delete ${toDelete.length} older simulators, keeping ${keepCount} per type? (type 'yes' to confirm): `,
      )
    ) {
      return [0, toDelete.length];
    }
    return deleteMany(toDelete);
  }
}
function deleteMany(simulators: any): any {
  let succeeded = 0;
  let failed = 0;
  for (const simulator of simulators) {
    const [success] = new SimulatorDeleter(simulator.udid).delete({
      confirm: true,
    });
    if (success) succeeded += 1;
    else failed += 1;
  }
  return [succeeded, failed];
}
export function readConfirmation(prompt: any): any {
  process.stdout.write(prompt);
  try {
    return (
      readFileSync(0, "utf8").trim().split(/\r?\n/)[0]?.toLowerCase() === "yes"
    );
  } catch {
    return false;
  }
}
function usage(): any {
  return `Delete iOS simulators permanently.

Usage: node scripts/simctl_delete.mjs [options]

Options:
  --udid <udid>          Device UDID or name
  --name <name>          Device name
  --yes                  Skip confirmation prompt
  --all                  Delete all simulators
  --type <type>          Delete all simulators of a type
  --old <keep-count>     Delete older simulators, keeping this many per type
  --json                 Output as JSON
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    udid: null,
    name: null,
    yes: false,
    all: false,
    type: null,
    old: null,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--yes") args.yes = true;
    else if (arg === "--all") args.all = true;
    else if (arg === "--json") args.json = true;
    else if (["--udid", "--name", "--type", "--old"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--udid") args.udid = value;
      if (arg === "--name") args.name = value;
      if (arg === "--type") args.type = value;
      if (arg === "--old") args.old = Number.parseInt(value, 10);
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (args.old !== null && !Number.isInteger(args.old))
    throw new Error("--old must be an integer");
  return args;
}
function outputBatch(
  args: any,
  action: any,
  result: any,
  extra: any = {},
): any {
  const [succeeded, failed] = result;
  const total = succeeded + failed;
  if (args.json)
    console.log(jsonLine({ action, ...extra, succeeded, failed, total }));
  else
    console.log(
      `${action.replaceAll("_", " ")} summary: ${succeeded}/${total} succeeded, ${failed} failed`,
    );
  return failed === 0 ? 0 : 1;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (args.all)
    return outputBatch(
      args,
      "delete_all",
      SimulatorDeleter.deleteAll({ confirm: args.yes }),
    );
  if (args.type) {
    return outputBatch(
      args,
      "delete_by_type",
      SimulatorDeleter.deleteByType(args.type, { confirm: args.yes }),
      {
        type: args.type,
      },
    );
  }
  if (args.old !== null) {
    return outputBatch(
      args,
      "delete_old",
      SimulatorDeleter.deleteOld({ keepCount: args.old, confirm: args.yes }),
      {
        keep_count: args.old,
      },
    );
  }
  const deviceId = args.udid || args.name;
  if (!deviceId) {
    console.error("Error: Specify --udid, --name, --all, --type, or --old");
    return 1;
  }
  const udid = resolveDeviceIdentifier(deviceId);
  const [success, message] = new SimulatorDeleter(udid).delete({
    confirm: args.yes,
  });
  if (args.json)
    console.log(
      jsonLine({
        action: "delete",
        device_id: deviceId,
        udid,
        success,
        message,
      }),
    );
  else console.log(message);
  return success ? 0 : 1;
}
