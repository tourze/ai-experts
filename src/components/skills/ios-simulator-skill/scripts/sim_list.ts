#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runXcrunSimctl } from "./simctl_common";

export class ProgressiveCache {
  constructor(cacheDir = null, maxAgeHours = 1) {
    this.cacheDir = cacheDir ?? join(homedir(), ".ios-simulator-skill", "cache");
    this.maxAgeHours = maxAgeHours;
    mkdirSync(this.cacheDir, { recursive: true });
  }

  save(data, cacheType) {
    const cacheId = `${cacheType.split("-", 1)[0]}-${formatCacheTimestamp(new Date())}`;
    writeFileSync(
      this.cachePath(cacheId),
      `${JSON.stringify(
        {
          cache_id: cacheId,
          cache_type: cacheType,
          created_at: new Date().toISOString(),
          data,
        },
        null,
        2,
      )}\n`,
    );
    return cacheId;
  }

  get(cacheId) {
    const file = this.cachePath(cacheId);
    if (!existsSync(file)) return null;
    if (this.isExpired(file)) {
      unlinkSync(file);
      return null;
    }
    try {
      return JSON.parse(readFileSync(file, "utf8")).data ?? null;
    } catch {
      return null;
    }
  }

  listEntries(cacheType = null) {
    const entries = [];
    for (const filename of readdirSync(this.cacheDir).filter((name) => name.endsWith(".json")).sort().reverse()) {
      const file = join(this.cacheDir, filename);
      if (this.isExpired(file)) {
        unlinkSync(file);
        continue;
      }
      try {
        const entry = JSON.parse(readFileSync(file, "utf8"));
        if (cacheType && entry.cache_type !== cacheType) continue;
        const createdAt = new Date(entry.created_at);
        entries.push({
          id: entry.cache_id,
          type: entry.cache_type,
          created_at: entry.created_at,
          age_seconds: Math.trunc((Date.now() - createdAt.getTime()) / 1000),
        });
      } catch {
        // Ignore corrupt cache entries.
      }
    }
    return entries;
  }

  cleanup(maxAgeHours = this.maxAgeHours) {
    let deleted = 0;
    for (const filename of readdirSync(this.cacheDir).filter((name) => name.endsWith(".json"))) {
      const file = join(this.cacheDir, filename);
      if (this.isExpired(file, maxAgeHours)) {
        unlinkSync(file);
        deleted += 1;
      }
    }
    return deleted;
  }

  clear(cacheType = null) {
    let deleted = 0;
    for (const filename of readdirSync(this.cacheDir).filter((name) => name.endsWith(".json"))) {
      const file = join(this.cacheDir, filename);
      if (!cacheType) {
        unlinkSync(file);
        deleted += 1;
        continue;
      }
      try {
        if (JSON.parse(readFileSync(file, "utf8")).cache_type === cacheType) {
          unlinkSync(file);
          deleted += 1;
        }
      } catch {
        // Ignore corrupt cache entries.
      }
    }
    return deleted;
  }

  cachePath(cacheId) {
    return join(this.cacheDir, `${cacheId}.json`);
  }

  isExpired(file, maxAgeHours = this.maxAgeHours) {
    try {
      const entry = JSON.parse(readFileSync(file, "utf8"));
      const createdAt = new Date(entry.created_at);
      return Number.isNaN(createdAt.getTime()) || Date.now() - createdAt.getTime() > maxAgeHours * 60 * 60 * 1000;
    } catch {
      return true;
    }
  }
}

export class SimulatorLister {
  constructor(cache = new ProgressiveCache()) {
    this.cache = cache;
  }

  listSimulators() {
    try {
      const result = runXcrunSimctl(["list", "devices", "--json"], { check: true });
      return JSON.parse(result.stdout);
    } catch {
      return { devices: {}, runtimes: [] };
    }
  }

  parseDevices(simData) {
    const devices = [];
    for (const [runtimeText, deviceList] of Object.entries(simData.devices ?? {})) {
      const runtime = runtimeText.replace(" Simulator", "").trim();
      for (const device of deviceList) {
        devices.push({
          name: device.name,
          udid: device.udid,
          state: device.state,
          runtime,
          is_available: device.isAvailable ?? false,
        });
      }
    }
    return devices;
  }

  getConciseSummary(devices) {
    const booted = devices.filter((device) => device.state === "Booted");
    const available = devices.filter((device) => device.is_available);
    const iphone = available.filter((device) => String(device.name).includes("iPhone"));
    const cacheId = this.cache.save({ devices, timestamp: new Date().toISOString() }, "simulator-list");
    return {
      cache_id: cacheId,
      summary: {
        total_devices: devices.length,
        available_devices: available.length,
        booted_devices: booted.length,
      },
      quick_access: {
        booted: booted.slice(0, 3),
        recommended_iphone: iphone.slice(0, 3),
      },
    };
  }

  getFullList(cacheId, { deviceType = null, runtime = null } = {}) {
    const data = this.cache.get(cacheId);
    if (!data) return null;
    let devices = data.devices ?? [];
    if (deviceType) devices = devices.filter((device) => String(device.name).includes(deviceType));
    if (runtime) devices = devices.filter((device) => String(device.runtime).toLowerCase().includes(runtime.toLowerCase()));
    return devices;
  }

  suggestSimulators(limit = 4) {
    const devices = this.parseDevices(this.listSimulators());
    const scored = devices.map((device) => ({ device, score: scoreDevice(device) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((item) => item.device);
  }
}

export function formatDevice(device) {
  const stateIcon = device.state === "Booted" ? "✓" : " ";
  const availIcon = device.is_available ? "●" : "○";
  const udidShort = device.udid ? `${device.udid.slice(0, 8)}...` : "unknown";
  return `${stateIcon} ${availIcon} ${device.name} (${device.runtime}) [${udidShort}]`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    getDetails: null,
    suggest: false,
    deviceType: null,
    runtime: null,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--suggest") args.suggest = true;
    else if (arg === "--json") args.json = true;
    else if (["--get-details", "--device-type", "--runtime"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--get-details") args.getDetails = value;
      if (arg === "--device-type") args.deviceType = value;
      if (arg === "--runtime") args.runtime = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return args;
}

export function usage() {
  return `List iOS simulators with progressive disclosure.

Usage: node scripts/sim_list.mjs [options]

Options:
  --get-details <cache-id>  Get full details for cached simulator list
  --suggest                 Get simulator recommendations
  --device-type <type>      Filter by device type
  --runtime <version>       Filter by iOS version
  --json                    Output as JSON
  --help                    Show this help
`;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }

  const lister = new SimulatorLister();
  if (args.getDetails) {
    const devices = lister.getFullList(args.getDetails, { deviceType: args.deviceType, runtime: args.runtime });
    if (devices == null) {
      console.log(`Error: Cache ID not found or expired: ${args.getDetails}`);
      return 1;
    }
    if (args.json) console.log(JSON.stringify(devices, null, 2));
    else {
      console.log(`Simulators (${devices.length}):\n`);
      for (const device of devices) console.log(`  ${formatDevice(device)}`);
    }
    return 0;
  }

  if (args.suggest) {
    const suggestions = lister.suggestSimulators();
    if (args.json) console.log(JSON.stringify(suggestions, null, 2));
    else {
      console.log("Recommended Simulators:\n");
      for (const [index, device] of suggestions.entries()) console.log(`${index + 1}. ${formatDevice(device)}`);
    }
    return 0;
  }

  const devices = lister.parseDevices(lister.listSimulators());
  const summary = lister.getConciseSummary(devices);
  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
    return 0;
  }
  console.log(formatSummary(summary));
  return 0;
}

export function formatSummary(summary) {
  const cacheId = summary.cache_id;
  const values = summary.summary;
  const quick = summary.quick_access;
  const lines = [
    `Simulator Summary [${cacheId}]`,
    `├─ Total: ${values.total_devices} devices`,
    `├─ Available: ${values.available_devices}`,
    `└─ Booted: ${values.booted_devices}`,
  ];
  if (quick.booted.length) {
    lines.push("");
    for (const device of quick.booted) lines.push(`  ${formatDevice(device)}`);
  }
  lines.push("", `Use --get-details ${cacheId} for full list`);
  return lines.join("\n");
}

function scoreDevice(device) {
  let score = 0;
  if (device.state === "Booted") score += 10;
  if (device.is_available) score += 5;
  if (String(device.runtime).includes("18")) score += 3;
  else if (String(device.runtime).includes("17")) score += 2;
  if (String(device.name).includes("iPhone")) score += 1;
  return score;
}

function formatCacheTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(
    date.getMinutes(),
  )}${pad(date.getSeconds())}`;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
