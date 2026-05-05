#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import {
  getBootedDeviceUdid,
  jsonLine,
  listSimulators,
  resolveDeviceIdentifier,
  runXcrunSimctl,
  sleep,
} from "./simctl_common.mjs";

export class SimulatorBooter {
  constructor(udid = null) {
    this.udid = udid;
  }

  async boot({ waitReady = false, timeoutSeconds = 120 } = {}) {
    if (!this.udid) return [false, "Error: Device UDID not specified"];
    const start = Date.now();

    const booted = getBootedDeviceUdid();
    if (booted === this.udid) {
      return [true, `Device already booted: ${this.udid} [checked in ${elapsedSeconds(start)}s]`];
    }

    const result = runXcrunSimctl(["boot", this.udid], { timeoutMs: 30000 });
    if (result.error?.code === "ETIMEDOUT") return [false, "Boot command timed out"];
    if (result.status !== 0) return [false, `Boot failed: ${(result.stderr ?? "").trim()}`];

    if (waitReady) {
      const [ready, message] = await this.waitForReady(timeoutSeconds);
      if (ready) return [true, `Device booted and ready: ${this.udid} [${elapsedSeconds(start)}s total]`];
      return [false, message];
    }

    return [
      true,
      `Device booted: ${this.udid} [boot in ${elapsedSeconds(start)}s] (use --wait-ready to wait for availability)`,
    ];
  }

  async waitForReady(timeoutSeconds = 120) {
    const start = Date.now();
    let checks = 0;
    while (Date.now() - start < timeoutSeconds * 1000) {
      checks += 1;
      const result = runXcrunSimctl(["spawn", this.udid, "launchctl", "list"], { timeoutMs: 5000 });
      if (result.status === 0) {
        return [true, `Device ready: ${this.udid} [${elapsedSeconds(start)}s, ${checks} checks]`];
      }
      await sleep(500);
    }
    return [
      false,
      `Boot timeout: Device did not reach ready state within ${elapsedSeconds(start)}s (${checks} checks)`,
    ];
  }

  static async bootAll() {
    return bootMany(listSimulators("available"));
  }

  static async bootByType(deviceType) {
    return bootMany(listSimulators("available").filter((sim) => sim.name.toLowerCase().includes(deviceType.toLowerCase())));
  }
}

async function bootMany(simulators) {
  let succeeded = 0;
  let failed = 0;
  for (const simulator of simulators) {
    const [success] = await new SimulatorBooter(simulator.udid).boot({ waitReady: false });
    if (success) succeeded += 1;
    else failed += 1;
  }
  return [succeeded, failed];
}

function elapsedSeconds(startMs) {
  return ((Date.now() - startMs) / 1000).toFixed(1);
}

function usage() {
  return `Boot iOS simulators and wait for readiness.

Usage: node scripts/simctl_boot.mjs [options]

Options:
  --udid <udid>          Device UDID or name
  --name <name>          Device name
  --wait-ready           Wait for device readiness
  --timeout <seconds>    Timeout for --wait-ready (default: 120)
  --all                  Boot all available simulators
  --type <type>          Boot all simulators of a type
  --json                 Output as JSON
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { udid: null, name: null, waitReady: false, timeout: 120, all: false, type: null, json: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--wait-ready") args.waitReady = true;
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
    const [succeeded, failed] = await SimulatorBooter.bootAll();
    const total = succeeded + failed;
    if (args.json) console.log(jsonLine({ action: "boot_all", succeeded, failed, total }));
    else console.log(`Boot summary: ${succeeded}/${total} succeeded, ${failed} failed`);
    return failed === 0 ? 0 : 1;
  }
  if (args.type) {
    const [succeeded, failed] = await SimulatorBooter.bootByType(args.type);
    const total = succeeded + failed;
    if (args.json) console.log(jsonLine({ action: "boot_by_type", type: args.type, succeeded, failed, total }));
    else console.log(`Boot ${args.type} summary: ${succeeded}/${total} succeeded, ${failed} failed`);
    return failed === 0 ? 0 : 1;
  }

  const deviceId = args.udid || args.name;
  if (!deviceId) {
    console.error("Error: Specify --udid, --name, --all, or --type");
    return 1;
  }
  const udid = resolveDeviceIdentifier(deviceId);
  const [success, message] = await new SimulatorBooter(udid).boot({
    waitReady: args.waitReady,
    timeoutSeconds: args.timeout,
  });
  if (args.json) console.log(jsonLine({ action: "boot", device_id: deviceId, udid, success, message }));
  else console.log(message);
  return success ? 0 : 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
