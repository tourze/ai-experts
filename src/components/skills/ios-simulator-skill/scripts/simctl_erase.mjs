#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { jsonLine, listSimulators, resolveDeviceIdentifier, runXcrunSimctl, sleep } from "./simctl_common.mjs";
import { realpathSync } from "node:fs";

export class SimulatorEraser {
  constructor(udid = null) {
    this.udid = udid;
  }

  async erase({ verify = false, timeoutSeconds = 30 } = {}) {
    if (!this.udid) return [false, "Error: Device UDID not specified"];
    const start = Date.now();
    const result = runXcrunSimctl(["erase", this.udid], { timeoutMs: 60000 });
    if (result.error?.code === "ETIMEDOUT") return [false, "Erase command timed out"];
    if (result.status !== 0) return [false, `Erase failed: ${(result.stderr || result.stdout || "").trim()}`];

    if (verify) {
      const [ready, message] = await this.verifyErase(timeoutSeconds);
      if (ready) return [true, `Device erased: ${this.udid} [factory reset complete, ${elapsedSeconds(start)}s]`];
      return [false, message];
    }
    return [true, `Device erase initiated: ${this.udid} [${elapsedSeconds(start)}s] (use --verify to wait for completion)`];
  }

  async verifyErase(timeoutSeconds = 30) {
    const start = Date.now();
    let checks = 0;
    while (Date.now() - start < timeoutSeconds * 1000) {
      checks += 1;
      const result = runXcrunSimctl(["spawn", this.udid, "launchctl", "list"], { timeoutMs: 5000 });
      if (result.status === 0) {
        return [true, `Erase verified: ${this.udid} [${elapsedSeconds(start)}s, ${checks} checks]`];
      }
      await sleep(500);
    }
    return [false, `Erase verification timeout: Device did not respond within ${elapsedSeconds(start)}s (${checks} checks)`];
  }

  static async eraseAll() {
    return eraseMany(listSimulators(null));
  }

  static async eraseByType(deviceType) {
    return eraseMany(listSimulators(null).filter((sim) => sim.name.toLowerCase().includes(deviceType.toLowerCase())));
  }

  static async eraseBooted() {
    return eraseMany(listSimulators("booted"));
  }
}

async function eraseMany(simulators) {
  let succeeded = 0;
  let failed = 0;
  for (const simulator of simulators) {
    const [success] = await new SimulatorEraser(simulator.udid).erase({ verify: false });
    if (success) succeeded += 1;
    else failed += 1;
  }
  return [succeeded, failed];
}

function elapsedSeconds(startMs) {
  return ((Date.now() - startMs) / 1000).toFixed(1);
}

function usage() {
  return `Erase iOS simulators (factory reset).

Usage: node scripts/simctl_erase.mjs [options]

Options:
  --udid <udid>          Device UDID or name
  --name <name>          Device name
  --verify               Wait for erase verification
  --timeout <seconds>    Timeout for --verify (default: 30)
  --all                  Erase all simulators
  --type <type>          Erase all simulators of a type
  --booted               Erase all currently booted simulators
  --json                 Output as JSON
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { udid: null, name: null, verify: false, timeout: 30, all: false, type: null, booted: false, json: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--verify") args.verify = true;
    else if (arg === "--all") args.all = true;
    else if (arg === "--booted") args.booted = true;
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

async function outputBatch(args, action, runner) {
  const [succeeded, failed] = await runner();
  const total = succeeded + failed;
  if (args.json) console.log(jsonLine({ action, succeeded, failed, total, ...(args.type ? { type: args.type } : {}) }));
  else console.log(`${action.replaceAll("_", " ")} summary: ${succeeded}/${total} succeeded, ${failed} failed`);
  return failed === 0 ? 0 : 1;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (args.all) return outputBatch(args, "erase_all", () => SimulatorEraser.eraseAll());
  if (args.type) return outputBatch(args, "erase_by_type", () => SimulatorEraser.eraseByType(args.type));
  if (args.booted) return outputBatch(args, "erase_booted", () => SimulatorEraser.eraseBooted());

  const deviceId = args.udid || args.name;
  if (!deviceId) {
    console.error("Error: Specify --udid, --name, --all, --type, or --booted");
    return 1;
  }
  const udid = resolveDeviceIdentifier(deviceId);
  const [success, message] = await new SimulatorEraser(udid).erase({
    verify: args.verify,
    timeoutSeconds: args.timeout,
  });
  if (args.json) console.log(jsonLine({ action: "erase", device_id: deviceId, udid, success, message }));
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
