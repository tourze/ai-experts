#!/usr/bin/env node
import { spawnSync } from "node:child_process";

export function runXcrunSimctl(args, { timeoutMs = 30000, check = false } = {}) {
  const result = spawnSync("xcrun", ["simctl", ...args.map(String)], {
    encoding: "utf8",
    timeout: timeoutMs,
  });
  if (check && result.status !== 0) {
    const error = new Error((result.stderr || result.stdout || "simctl command failed").trim());
    error.result = result;
    throw error;
  }
  return result;
}

export function buildSimctlCommand(operation, udid = null, ...args) {
  return ["xcrun", "simctl", operation, udid || "booted", ...args.map(String)];
}

export function extractDeviceType(deviceName) {
  if (deviceName.includes("iPhone")) return "iPhone";
  if (deviceName.includes("iPad")) return "iPad";
  if (deviceName.includes("Watch") || deviceName.includes("Apple Watch")) return "Watch";
  if (deviceName.includes("TV") || deviceName.includes("Apple TV")) return "TV";
  return "Unknown";
}

export function parseSimulatorsFromList(data) {
  const simulators = [];
  for (const [runtime, devices] of Object.entries(data.devices ?? {})) {
    for (const device of devices) {
      simulators.push({
        name: device.name ?? "Unknown",
        udid: device.udid ?? "",
        state: device.state ?? "Unknown",
        runtime,
        type: extractDeviceType(device.name ?? ""),
      });
    }
  }
  return simulators;
}

export function filterSimulatorsByState(simulators, state = null) {
  if (state === "booted") return simulators.filter((sim) => sim.state === "Booted");
  if (state === "available") return simulators.filter((sim) => sim.state === "Shutdown");
  if (state == null) return simulators;
  return simulators.filter((sim) => sim.state.toLowerCase() === state.toLowerCase());
}

export function listSimulators(state = null) {
  const result = runXcrunSimctl(["list", "devices", "-j"], { check: true });
  return filterSimulatorsByState(parseSimulatorsFromList(JSON.parse(result.stdout)), state);
}

export function parseBootedDeviceUdid(output) {
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/\(([A-F0-9-]{36})\)/i);
    if (match) return match[1];
  }
  return null;
}

export function getBootedDeviceUdid() {
  const result = runXcrunSimctl(["list", "devices", "booted"]);
  if (result.status !== 0) return null;
  return parseBootedDeviceUdid(result.stdout ?? "");
}

export function resolveDeviceIdentifier(identifier, simulators = null, bootedUdid = getBootedDeviceUdid()) {
  if (!identifier) throw new Error("Device identifier is required");
  if (identifier.toLowerCase() === "booted") {
    if (bootedUdid) return bootedUdid;
    throw new Error("No simulator is currently booted. Boot a simulator first: xcrun simctl boot <device-udid>");
  }

  if (/^[A-F0-9-]{36}$/i.test(identifier)) {
    return identifier.toUpperCase();
  }

  const devices = simulators ?? listSimulators(null);
  const exact = devices.find((sim) => sim.name.toLowerCase() === identifier.toLowerCase());
  if (exact) return exact.udid;

  const partial = devices.find((sim) => sim.name.toLowerCase().includes(identifier.toLowerCase()));
  if (partial) return partial.udid;

  throw new Error(`Device '${identifier}' not found. Use 'xcrun simctl list devices' to see available simulators.`);
}

export function jsonLine(value) {
  return JSON.stringify(value);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
