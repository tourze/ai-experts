import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export function getAdbPath(env = process.env) {
  const binary = process.platform === "win32" ? "adb.exe" : "adb";
  if (env.ANDROID_HOME) {
    const adbPath = join(env.ANDROID_HOME, "platform-tools", binary);
    if (existsSync(adbPath)) return adbPath;
  }

  const pathResult = spawnSync("adb", ["--version"], { stdio: "ignore" });
  if (pathResult.status === 0) return "adb";

  const candidates = [
    join(homedir(), "Library/Android/sdk/platform-tools", binary),
    join(homedir(), "Android/Sdk/platform-tools", binary),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return "adb";
}

export const ADB_PATH = getAdbPath();

export function runAdbCommand(cmd, serial = null, { check = true } = {}) {
  const fullCommand = [ADB_PATH];
  if (serial) fullCommand.push("-s", serial);
  fullCommand.push(...cmd);

  const result = spawnSync(fullCommand[0], fullCommand.slice(1), {
    encoding: "utf-8",
  });
  if (check && result.status !== 0) {
    const error = new Error(result.stderr || result.stdout || `adb exited with code ${result.status ?? 1}`);
    error.result = result;
    throw error;
  }
  return result;
}

export function parseAdbDevices(output) {
  const lines = output.trim().split(/\r?\n/).slice(1);
  const devices = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2 && parts[1] === "device") {
      devices.push(parts[0]);
    }
  }
  return devices;
}

export function getConnectedDevices() {
  return parseAdbDevices(runAdbCommand(["devices"]).stdout ?? "");
}

export function resolveSerial(serial = null, devices = getConnectedDevices()) {
  if (serial) {
    if (!devices.includes(serial)) {
      throw new Error(`Device '${serial}' not found or not connected.`);
    }
    return serial;
  }
  if (!devices.length) {
    throw new Error("No Android devices connected or emulators running.");
  }
  if (devices.length === 1) {
    return devices[0];
  }
  throw new Error(`Multiple devices connected: ${devices.join(", ")}. Please specify one with --serial.`);
}

export function parseScreenSize(output) {
  const line = output.trim().split(/\r?\n/)[0] ?? "";
  if (line.includes("Physical size:")) {
    const size = line.split(":").at(-1).trim();
    const [width, height] = size.split("x").map((value) => Number.parseInt(value, 10));
    if (Number.isInteger(width) && Number.isInteger(height)) {
      return [width, height];
    }
  }
  return [1080, 1920];
}

export function getScreenSize(serial) {
  const result = runAdbCommand(["shell", "wm", "size"], serial);
  return parseScreenSize(result.stdout ?? "");
}
