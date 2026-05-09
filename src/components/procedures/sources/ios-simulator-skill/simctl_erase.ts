#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import {
  jsonLine,
  listSimulators,
  resolveDeviceIdentifier,
  runXcrunSimctl,
  sleep,
} from "./simctl_common";
import { readFileSync, realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-simctl-erase",
  entry: procedureEntry(import.meta.url),
  description:
    "擦除 iOS 模拟器（恢复出厂设置）：支持单设备擦除、全部擦除、按类型擦除和已启动设备擦除。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/simctl_erase.mjs",
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
      flag: "--verify",
      type: "",
      description: "等待擦除验证，传此标志即启用",
      required: false,
    },
    {
      flag: "--yes",
      type: "",
      description: "跳过确认提示；仅在用户已明确确认擦除目标后使用",
      required: false,
    },
    {
      flag: "--timeout",
      type: "数字",
      description: "验证超时秒数（默认 30）",
      required: false,
    },
    { flag: "--all", type: "", description: "擦除所有模拟器", required: false },
    {
      flag: "--type",
      type: "字符串",
      description: "擦除指定类型的所有模拟器",
      required: false,
    },
    {
      flag: "--booted",
      type: "",
      description: "擦除所有已启动模拟器",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "输出为 JSON，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--udid", "<device-udid>"] },
});

export class SimulatorEraser {
  udid: any;
  constructor(udid: any = null) {
    this.udid = udid;
  }
  async erase({
    verify = false,
    timeoutSeconds = 30,
    confirm = false,
  }: any = {}): Promise<any> {
    if (!this.udid) return [false, "Error: Device UDID not specified"];
    if (
      !confirm &&
      !readConfirmation(
        `Erase simulator ${this.udid} and reset all app data? (type 'yes' to confirm): `,
      )
    ) {
      return [false, "Erase cancelled: confirmation required"];
    }
    const start = Date.now();
    const result = runXcrunSimctl(["erase", this.udid], { timeoutMs: 60000 });
    if (result.error?.code === "ETIMEDOUT")
      return [false, "Erase command timed out"];
    if (result.status !== 0)
      return [
        false,
        `Erase failed: ${(result.stderr || result.stdout || "").trim()}`,
      ];
    if (verify) {
      const [ready, message] = await this.verifyErase(timeoutSeconds);
      if (ready)
        return [
          true,
          `Device erased: ${this.udid} [factory reset complete, ${elapsedSeconds(start)}s]`,
        ];
      return [false, message];
    }
    return [
      true,
      `Device erase initiated: ${this.udid} [${elapsedSeconds(start)}s] (use --verify to wait for completion)`,
    ];
  }
  async verifyErase(timeoutSeconds: any = 30): Promise<any> {
    const start = Date.now();
    let checks = 0;
    while (Date.now() - start < timeoutSeconds * 1000) {
      checks += 1;
      const result = runXcrunSimctl(["spawn", this.udid, "launchctl", "list"], {
        timeoutMs: 5000,
      });
      if (result.status === 0) {
        return [
          true,
          `Erase verified: ${this.udid} [${elapsedSeconds(start)}s, ${checks} checks]`,
        ];
      }
      await sleep(500);
    }
    return [
      false,
      `Erase verification timeout: Device did not respond within ${elapsedSeconds(start)}s (${checks} checks)`,
    ];
  }
  static async eraseAll({ confirm = false }: any = {}): Promise<any> {
    return eraseMany(listSimulators(null), { confirm });
  }
  static async eraseByType(
    deviceType: any,
    { confirm = false }: any = {},
  ): Promise<any> {
    return eraseMany(
      listSimulators(null).filter((sim: any) =>
        sim.name.toLowerCase().includes(deviceType.toLowerCase()),
      ),
      { confirm },
    );
  }
  static async eraseBooted({ confirm = false }: any = {}): Promise<any> {
    return eraseMany(listSimulators("booted"), { confirm });
  }
}
async function eraseMany(
  simulators: any,
  { confirm = false }: any = {},
): Promise<any> {
  if (
    simulators.length > 0 &&
    !confirm &&
    !readConfirmation(
      `Erase ${simulators.length} simulator(s) and reset all app data? (type 'yes' to confirm): `,
    )
  ) {
    return [0, simulators.length];
  }
  let succeeded = 0;
  let failed = 0;
  for (const simulator of simulators) {
    const [success] = await new SimulatorEraser(simulator.udid).erase({
      confirm: true,
      verify: false,
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
function elapsedSeconds(startMs: any): any {
  return ((Date.now() - startMs) / 1000).toFixed(1);
}
function usage(): any {
  return `Erase iOS simulators (factory reset).

Usage: node scripts/simctl_erase.mjs [options]

Options:
  --udid <udid>          Device UDID or name
  --name <name>          Device name
  --verify               Wait for erase verification
  --yes                  Skip confirmation prompt after explicit user approval
  --timeout <seconds>    Timeout for --verify (default: 30)
  --all                  Erase all simulators
  --type <type>          Erase all simulators of a type
  --booted               Erase all currently booted simulators
  --json                 Output as JSON
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    udid: null,
    name: null,
    verify: false,
    yes: false,
    timeout: 30,
    all: false,
    type: null,
    booted: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--verify") args.verify = true;
    else if (arg === "--yes") args.yes = true;
    else if (arg === "--all") args.all = true;
    else if (arg === "--booted") args.booted = true;
    else if (arg === "--json") args.json = true;
    else if (["--udid", "--name", "--timeout", "--type"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--udid") args.udid = value;
      if (arg === "--name") args.name = value;
      if (arg === "--timeout") args.timeout = Number.parseInt(value, 10);
      if (arg === "--type") args.type = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.timeout))
    throw new Error("--timeout must be an integer");
  return args;
}
async function outputBatch(args: any, action: any, runner: any): Promise<any> {
  const [succeeded, failed] = await runner();
  const total = succeeded + failed;
  if (args.json)
    console.log(
      jsonLine({
        action,
        succeeded,
        failed,
        total,
        ...(args.type ? { type: args.type } : {}),
      }),
    );
  else
    console.log(
      `${action.replaceAll("_", " ")} summary: ${succeeded}/${total} succeeded, ${failed} failed`,
    );
  return failed === 0 ? 0 : 1;
}
export async function main(argv: readonly string[]): Promise<any> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (args.all)
    return outputBatch(args, "erase_all", () => SimulatorEraser.eraseAll({ confirm: args.yes }));
  if (args.type)
    return outputBatch(args, "erase_by_type", () =>
      SimulatorEraser.eraseByType(args.type, { confirm: args.yes }),
    );
  if (args.booted)
    return outputBatch(args, "erase_booted", () =>
      SimulatorEraser.eraseBooted({ confirm: args.yes }),
    );
  const deviceId = args.udid || args.name;
  if (!deviceId) {
    console.error("Error: Specify --udid, --name, --all, --type, or --booted");
    return 1;
  }
  const udid = resolveDeviceIdentifier(deviceId);
  const [success, message] = await new SimulatorEraser(udid).erase({
    confirm: args.yes,
    verify: args.verify,
    timeoutSeconds: args.timeout,
  });
  if (args.json)
    console.log(
      jsonLine({
        action: "erase",
        device_id: deviceId,
        udid,
        success,
        message,
      }),
    );
  else console.log(message);
  return success ? 0 : 1;
}
