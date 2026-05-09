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
  id: "ios-simulator-skill-simctl-shutdown",
  entry: procedureEntry(import.meta.url),
  description:
    "关闭 iOS 模拟器：支持单设备关闭、全部关闭和按类型关闭，可选验证等待。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/simctl_shutdown.mjs",
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
      description: "等待关闭验证，传此标志即启用",
      required: false,
    },
    {
      flag: "--yes",
      type: "",
      description: "跳过关闭确认；仅在用户已明确确认关闭目标后使用",
      required: false,
    },
    {
      flag: "--timeout",
      type: "数字",
      description: "验证超时秒数（默认 30）",
      required: false,
    },
    {
      flag: "--all",
      type: "",
      description: "关闭所有已启动模拟器",
      required: false,
    },
    {
      flag: "--type",
      type: "字符串",
      description: "关闭指定类型的所有已启动模拟器",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "输出为 JSON，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--udid", "<device-udid>", "--verify"] },
});

export class SimulatorShutdown {
  udid: any;
  constructor(udid: any = null) {
    this.udid = udid;
  }
  async shutdown({
    verify = false,
    timeoutSeconds = 30,
    confirm = false,
  }: any = {}): Promise<any> {
    if (!this.udid) return [false, "Error: Device UDID not specified"];
    if (
      !confirm &&
      !readConfirmation(
        `Shutdown iOS simulator ${this.udid}? (type 'yes' to confirm): `,
      )
    ) {
      return [false, "Shutdown cancelled: confirmation required"];
    }
    const start = Date.now();
    if (!listSimulators("booted").some((sim: any) => sim.udid === this.udid)) {
      return [
        true,
        `Device already shutdown: ${this.udid} [checked in ${elapsedSeconds(start)}s]`,
      ];
    }
    const result = runXcrunSimctl(["shutdown", this.udid], {
      timeoutMs: 30000,
    });
    if (result.error?.code === "ETIMEDOUT")
      return [false, "Shutdown command timed out"];
    if (result.status !== 0)
      return [false, `Shutdown failed: ${(result.stderr ?? "").trim()}`];
    if (verify) {
      const [ready, message] = await this.verifyShutdown(timeoutSeconds);
      if (ready)
        return [
          true,
          `Device shutdown confirmed: ${this.udid} [${elapsedSeconds(start)}s total]`,
        ];
      return [false, message];
    }
    return [
      true,
      `Device shutdown: ${this.udid} [${elapsedSeconds(start)}s] (use --verify to wait for confirmation)`,
    ];
  }
  async verifyShutdown(timeoutSeconds: any = 30): Promise<any> {
    const start = Date.now();
    let checks = 0;
    while (Date.now() - start < timeoutSeconds * 1000) {
      checks += 1;
      if (
        !listSimulators("booted").some((sim: any) => sim.udid === this.udid)
      ) {
        return [
          true,
          `Device shutdown verified: ${this.udid} [${elapsedSeconds(start)}s, ${checks} checks]`,
        ];
      }
      await sleep(500);
    }
    return [
      false,
      `Shutdown verification timeout: Device did not fully shutdown within ${elapsedSeconds(start)}s (${checks} checks)`,
    ];
  }
  static async shutdownAll({ confirm = false }: any = {}): Promise<any> {
    return shutdownMany(listSimulators("booted"), { confirm });
  }
  static async shutdownByType(
    deviceType: any,
    { confirm = false }: any = {},
  ): Promise<any> {
    return shutdownMany(
      listSimulators("booted").filter((sim: any) =>
        sim.name.toLowerCase().includes(deviceType.toLowerCase()),
      ),
      { confirm },
    );
  }
}
async function shutdownMany(
  simulators: any,
  { confirm = false }: any = {},
): Promise<any> {
  if (
    simulators.length > 0 &&
    !confirm &&
    !readConfirmation(
      `Shutdown ${simulators.length} iOS simulator(s)? (type 'yes' to confirm): `,
    )
  ) {
    return [0, simulators.length];
  }
  let succeeded = 0;
  let failed = 0;
  for (const simulator of simulators) {
    const [success] = await new SimulatorShutdown(simulator.udid).shutdown({
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
  return `Shutdown iOS simulators with optional verification.

Usage: node scripts/simctl_shutdown.mjs [options]

Options:
  --udid <udid>          Device UDID or name
  --name <name>          Device name
  --verify               Wait for shutdown verification
  --yes                  Skip shutdown confirmation after explicit user approval
  --timeout <seconds>    Timeout for --verify (default: 30)
  --all                  Shutdown all booted simulators
  --type <type>          Shutdown all booted simulators of a type
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
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--verify") args.verify = true;
    else if (arg === "--yes") args.yes = true;
    else if (arg === "--all") args.all = true;
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
export async function main(argv: readonly string[]): Promise<any> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (args.all) {
    const [succeeded, failed] = await SimulatorShutdown.shutdownAll({
      confirm: args.yes,
    });
    const total = succeeded + failed;
    if (args.json)
      console.log(
        jsonLine({ action: "shutdown_all", succeeded, failed, total }),
      );
    else
      console.log(
        `Shutdown summary: ${succeeded}/${total} succeeded, ${failed} failed`,
      );
    return failed === 0 ? 0 : 1;
  }
  if (args.type) {
    const [succeeded, failed] = await SimulatorShutdown.shutdownByType(
      args.type,
      { confirm: args.yes },
    );
    const total = succeeded + failed;
    if (args.json)
      console.log(
        jsonLine({
          action: "shutdown_by_type",
          type: args.type,
          succeeded,
          failed,
          total,
        }),
      );
    else
      console.log(
        `Shutdown ${args.type} summary: ${succeeded}/${total} succeeded, ${failed} failed`,
      );
    return failed === 0 ? 0 : 1;
  }
  const deviceId = args.udid || args.name;
  if (!deviceId) {
    console.error("Error: Specify --udid, --name, --all, or --type");
    return 1;
  }
  const udid = resolveDeviceIdentifier(deviceId);
  const [success, message] = await new SimulatorShutdown(udid).shutdown({
    confirm: args.yes,
    verify: args.verify,
    timeoutSeconds: args.timeout,
  });
  if (args.json)
    console.log(
      jsonLine({
        action: "shutdown",
        device_id: deviceId,
        udid,
        success,
        message,
      }),
    );
  else console.log(message);
  return success ? 0 : 1;
}
