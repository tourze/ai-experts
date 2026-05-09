#!/usr/bin/env node
import { spawnSync } from "node:child_process";
export function runXcrunSimctl(
  args: any,
  { timeoutMs = 30000, check = false }: any = {},
): any {
  const result = spawnSync("xcrun", ["simctl", ...args.map(String)], {
    encoding: "utf8",
    timeout: timeoutMs,
  });
  if (check && result.status !== 0) {
    const error = new Error(
      (result.stderr || result.stdout || "simctl command failed").trim(),
    );
    (error as Error & { result: typeof result }).result = result;
    throw error;
  }
  return result;
}
export function buildSimctlCommand(
  operation: any,
  udid: any = null,
  ...args: any
): any {
  return ["xcrun", "simctl", operation, udid || "booted", ...args.map(String)];
}
export function extractDeviceType(deviceName: any): any {
  if (deviceName.includes("iPhone")) return "iPhone";
  if (deviceName.includes("iPad")) return "iPad";
  if (deviceName.includes("Watch") || deviceName.includes("Apple Watch"))
    return "Watch";
  if (deviceName.includes("TV") || deviceName.includes("Apple TV")) return "TV";
  return "Unknown";
}
export function parseSimulatorsFromList(data: any): any {
  const simulators: any[] = [];
  for (const [runtime, devices] of Object.entries(
    (data.devices ?? {}) as Record<string, any[]>,
  )) {
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
export function filterSimulatorsByState(
  simulators: any,
  state: any = null,
): any {
  if (state === "booted")
    return simulators.filter((sim: any) => sim.state === "Booted");
  if (state === "available")
    return simulators.filter((sim: any) => sim.state === "Shutdown");
  if (state == null) return simulators;
  return simulators.filter(
    (sim: any) => sim.state.toLowerCase() === state.toLowerCase(),
  );
}
export function listSimulators(state: any = null): any {
  const result = runXcrunSimctl(["list", "devices", "-j"], { check: true });
  return filterSimulatorsByState(
    parseSimulatorsFromList(JSON.parse(result.stdout)),
    state,
  );
}
export function parseBootedDeviceUdid(output: any): any {
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/\(([A-F0-9-]{36})\)/i);
    if (match) return match[1];
  }
  return null;
}
export function getBootedDeviceUdid(): any {
  const result = runXcrunSimctl(["list", "devices", "booted"]);
  if (result.status !== 0) return null;
  return parseBootedDeviceUdid(result.stdout ?? "");
}
export function resolveDeviceIdentifier(
  identifier: any,
  simulators: any = null,
  bootedUdid: any = getBootedDeviceUdid(),
): any {
  if (!identifier) throw new Error("Device identifier is required");
  if (identifier.toLowerCase() === "booted") {
    if (bootedUdid) return bootedUdid;
    throw new Error(
      "No simulator is currently booted. Boot a simulator first: xcrun simctl boot <device-udid>",
    );
  }
  if (/^[A-F0-9-]{36}$/i.test(identifier)) {
    return identifier.toUpperCase();
  }
  const devices = simulators ?? listSimulators(null);
  const exact = devices.find(
    (sim: any) => sim.name.toLowerCase() === identifier.toLowerCase(),
  );
  if (exact) return exact.udid;
  const partial = devices.find((sim: any) =>
    sim.name.toLowerCase().includes(identifier.toLowerCase()),
  );
  if (partial) return partial.udid;
  throw new Error(
    `Device '${identifier}' not found. Use 'xcrun simctl list devices' to see available simulators.`,
  );
}
export function jsonLine(value: any): any {
  return JSON.stringify(value);
}
export function sleep(ms: any): any {
  return new Promise((resolve: any) => setTimeout(resolve, ms));
}
