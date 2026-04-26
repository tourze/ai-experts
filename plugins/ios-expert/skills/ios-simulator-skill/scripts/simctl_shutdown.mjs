#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { jsonLine, listSimulators, resolveDeviceIdentifier, runXcrunSimctl, sleep } from "./simctl_common.mjs";

export class SimulatorShutdown {
  constructor(udid = null) {
    this.udid = udid;
  }

  async shutdown({ verify = false, timeoutSeconds = 30 } = {}) {
    if (!this.udid) return [false, "Error: Device UDID not specified"];
    const start = Date.now();

    if (!listSimulators("booted").some((sim) => sim.udid === this.udid)) {
      return [true, `Device already shutdown: ${this.udid} [checked in ${elapsedSeconds(start)}s]`];
    }

    const result = runXcrunSimctl(["shutdown", this.udid], { timeoutMs: 30000 });
    if (result.error?.code === "ETIMEDOUT") return [false, "Shutdown command timed out"];
    if (result.status !== 0) return [false, `Shutdown failed: ${(result.stderr ?? "").trim()}`];

    if (verify) {
      const [ready, message] = await this.verifyShutdown(timeoutSeconds);
      if (ready) return [true, `Device shutdown confirmed: ${this.udid} [${elapsedSeconds(start)}s total]`];
      return [false, message];
    }

    return [true, `Device shutdown: ${this.udid} [${elapsedSeconds(start)}s] (use --verify to wait for confirmation)`];
  }

  async verifyShutdown(timeoutSeconds = 30) {
    const start = Date.now();
    let checks = 0;
    while (Date.now() - start < timeoutSeconds * 1000) {
      checks += 1;
      if (!listSimulators("booted").some((sim) => sim.udid === this.udid)) {
        return [true, `Device shutdown verified: ${this.udid} [${elapsedSeconds(start)}s, ${checks} checks]`];
      }
      await sleep(500);
    }
    return [
      false,
      `Shutdown verification timeout: Device did not fully shutdown within ${elapsedSeconds(start)}s (${checks} checks)`,
    ];
  }

  static async shutdownAll() {
    return shutdownMany(listSimulators("booted"));
  }

  static async shutdownByType(deviceType) {
    return shutdownMany(listSimulators("booted").filter((sim) => sim.name.toLowerCase().includes(deviceType.toLowerCase())));
  }
}

async function shutdownMany(simulators) {
  let succeeded = 0;
  let failed = 0;
  for (const simulator of simulators) {
    const [success] = await new SimulatorShutdown(simulator.udid).shutdown({ verify: false });
    if (success) succeeded += 1;
    else failed += 1;
  }
  return [succeeded, failed];
}

function elapsedSeconds(startMs) {
  return ((Date.now() - startMs) / 1000).toFixed(1);
}

function usage() {
  return `Shutdown iOS simulators with optional verification.

Usage: node scripts/simctl_shutdown.mjs [options]

Options:
  --udid <udid>          Device UDID or name
  --name <name>          Device name
  --verify               Wait for shutdown verification
  --timeout <seconds>    Timeout for --verify (default: 30)
  --all                  Shutdown all booted simulators
  --type <type>          Shutdown all booted simulators of a type
  --json                 Output as JSON
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { udid: null, name: null, verify: false, timeout: 30, all: false, type: null, json: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--verify") args.verify = true;
    else if (arg === "--all") args.all = true;
    else if (arg === "--json") args.json = true;
    else if (["--udid", "--name", "--timeout", "--type"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--udid") args.udid = value;
      if (arg === "--name") args.name = value;
      if (arg === "--timeout") args.timeout = Number.parseInt(value, 10);
      if (arg === "--type") args.type = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.timeout)) throw new Error("--timeout must be an integer");
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (args.all) {
    const [succeeded, failed] = await SimulatorShutdown.shutdownAll();
    const total = succeeded + failed;
    if (args.json) console.log(jsonLine({ action: "shutdown_all", succeeded, failed, total }));
    else console.log(`Shutdown summary: ${succeeded}/${total} succeeded, ${failed} failed`);
    return failed === 0 ? 0 : 1;
  }
  if (args.type) {
    const [succeeded, failed] = await SimulatorShutdown.shutdownByType(args.type);
    const total = succeeded + failed;
    if (args.json) console.log(jsonLine({ action: "shutdown_by_type", type: args.type, succeeded, failed, total }));
    else console.log(`Shutdown ${args.type} summary: ${succeeded}/${total} succeeded, ${failed} failed`);
    return failed === 0 ? 0 : 1;
  }

  const deviceId = args.udid || args.name;
  if (!deviceId) {
    console.error("Error: Specify --udid, --name, --all, or --type");
    return 1;
  }
  const udid = resolveDeviceIdentifier(deviceId);
  const [success, message] = await new SimulatorShutdown(udid).shutdown({
    verify: args.verify,
    timeoutSeconds: args.timeout,
  });
  if (args.json) console.log(jsonLine({ action: "shutdown", device_id: deviceId, udid, success, message }));
  else console.log(message);
  return success ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
