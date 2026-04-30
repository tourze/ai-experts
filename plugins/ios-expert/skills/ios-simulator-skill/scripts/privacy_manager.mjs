#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { resolveUdid, runCommand } from "./interaction_common.mjs";
import { realpathSync } from "node:fs";

export const SUPPORTED_SERVICES = {
  camera: "Camera access",
  microphone: "Microphone access",
  location: "Location services",
  contacts: "Contacts access",
  photos: "Photos library access",
  calendar: "Calendar access",
  health: "Health data access",
  reminders: "Reminders access",
  motion: "Motion & fitness",
  keyboard: "Keyboard access",
  mediaLibrary: "Media library",
  calls: "Call history",
  siri: "Siri access",
};

export class PrivacyManager {
  constructor(udid = null, now = () => new Date()) {
    this.udid = udid;
    this.now = now;
  }

  grantPermission(bundleId, service, options = {}) {
    return this.applyPermission("grant", bundleId, service, options);
  }

  revokePermission(bundleId, service, options = {}) {
    return this.applyPermission("revoke", bundleId, service, options);
  }

  resetPermission(bundleId, service, options = {}) {
    return this.applyPermission("reset", bundleId, service, options);
  }

  applyPermission(action, bundleId, service, { scenario = null, step = null } = {}) {
    if (!Object.hasOwn(SUPPORTED_SERVICES, service)) {
      console.log(`Error: Unknown service '${service}'`);
      if (action === "grant") console.log(`Supported: ${Object.keys(SUPPORTED_SERVICES).join(", ")}`);
      return false;
    }
    const command = ["xcrun", "simctl", "privacy", this.udid || "booted", action, service, bundleId];
    if (runCommand(command).status !== 0) return false;
    console.log(formatAudit(action, bundleId, service, { scenario, step, timestamp: this.now().toISOString() }));
    return true;
  }
}

export function formatAudit(action, bundleId, service, { scenario = null, step = null, timestamp = new Date().toISOString() } = {}) {
  const location = step ? ` (step ${step})` : "";
  const scenarioInfo = scenario ? ` in ${scenario}` : "";
  return `[Audit] ${timestamp}: ${action.toUpperCase()} ${service} for ${bundleId}${scenarioInfo}${location}`;
}

function usage() {
  return `Manage iOS app privacy and permissions.

Usage: node scripts/privacy_manager.mjs --bundle-id <id> [action]

Actions:
  --grant <services>     Grant comma-separated services
  --revoke <services>    Revoke comma-separated services
  --reset <services>     Reset comma-separated services
  --list                 List supported services

Options:
  --scenario <name>      Test scenario name
  --step <number>        Step number
  --udid <udid>          Device UDID
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { bundleId: null, grant: null, revoke: null, reset: null, list: false, scenario: null, step: null, udid: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--list") args.list = true;
    else if (["--bundle-id", "--grant", "--revoke", "--reset", "--scenario", "--step", "--udid"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--bundle-id") args.bundleId = value;
      if (arg === "--grant") args.grant = value;
      if (arg === "--revoke") args.revoke = value;
      if (arg === "--reset") args.reset = value;
      if (arg === "--scenario") args.scenario = value;
      if (arg === "--step") args.step = Number.parseInt(value, 10);
      if (arg === "--udid") args.udid = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (args.step !== null && !Number.isInteger(args.step)) throw new Error("--step must be an integer");
  const actionCount = [args.grant, args.revoke, args.reset, args.list].filter(Boolean).length;
  if (actionCount > 1) throw new Error("--grant, --revoke, --reset, and --list are mutually exclusive");
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.bundleId) {
    console.error("Error: --bundle-id is required");
    return 1;
  }
  if (args.list) {
    console.log("Supported Privacy Services:\n");
    for (const [service, description] of Object.entries(SUPPORTED_SERVICES)) console.log(`  ${service.padEnd(15)} - ${description}`);
    console.log("");
    console.log("Examples:");
    console.log("  node scripts/privacy_manager.mjs --grant camera --bundle-id com.app");
    console.log("  node scripts/privacy_manager.mjs --revoke location --bundle-id com.app");
    console.log("  node scripts/privacy_manager.mjs --grant camera,photos --bundle-id com.app");
    return 0;
  }

  const manager = new PrivacyManager(resolveUdid(args.udid));
  const action = args.grant ? "grant" : args.revoke ? "revoke" : args.reset ? "reset" : null;
  if (!action) {
    console.log(usage());
    return 1;
  }
  const services = args[action].split(",").map((service) => service.trim());
  let allSuccess = true;
  for (const service of services) {
    if (!Object.hasOwn(SUPPORTED_SERVICES, service)) {
      console.log(`Error: Unknown service '${service}'`);
      allSuccess = false;
      continue;
    }
    const success = manager.applyPermission(action, args.bundleId, service, {
      scenario: args.scenario,
      step: args.step,
    });
    if (success) console.log(`OK ${capitalize(action)} ${service}: ${SUPPORTED_SERVICES[service]}`);
    else {
      console.log(`Failed to ${action} ${service}`);
      allSuccess = false;
    }
  }
  if (!allSuccess) return 1;
  if (services.length > 1) console.log(`\nPermissions ${action}ed: ${services.join(", ")}`);
  if (args.scenario) console.log(`Test scenario: ${args.scenario}${args.step ? ` (step ${args.step})` : ""}`);
  return 0;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
