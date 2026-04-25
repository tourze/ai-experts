#!/usr/bin/env node
// Probe local network environment and cache the result in ~/.site-analyzer-env.json.
// Usage: node 00_probe_env.mjs [--force]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ENV_FILE = path.join(os.homedir(), ".site-analyzer-env.json");
const force = process.argv.includes("--force");

if (fs.existsSync(ENV_FILE) && !force) {
  console.log("[env] Already probed. Use --force to re-probe.");
  process.stdout.write(fs.readFileSync(ENV_FILE, "utf8"));
  process.exit(0);
}

function commandExists(command) {
  const pathValue = process.env.PATH || "";
  const dirs = pathValue.split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";")
    : [""];

  for (const dir of dirs) {
    for (const ext of extensions) {
      const candidate = path.join(dir, process.platform === "win32" ? `${command}${ext}` : command);
      try {
        if (fs.statSync(candidate).isFile()) {
          return true;
        }
      } catch {
        // Keep scanning PATH.
      }
    }
  }
  return false;
}

async function fetchText(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return "";
    }
    return await response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs = 5000) {
  const text = await fetchText(url, timeoutMs);
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function readDefaultDns() {
  try {
    return fs.readFileSync("/etc/resolv.conf", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/))
      .filter(([key, value]) => key === "nameserver" && value)
      .slice(0, 3)
      .map(([, value]) => value)
      .join(",");
  } catch {
    return "";
  }
}

async function resolveExitIp() {
  const ipify = (await fetchText("https://api.ipify.org")).trim();
  if (ipify) {
    return ipify;
  }

  const fallback = await fetchJson("http://ip-api.com/json");
  return fallback.query || "";
}

async function main() {
  console.error("[env] Probing network environment...");

  const myIp = await resolveExitIp();
  const ipInfo = myIp ? await fetchJson(`http://ip-api.com/json/${encodeURIComponent(myIp)}`) : {};
  const data = {
    my_ip: myIp,
    country: ipInfo.country || "unknown",
    city: ipInfo.city || "unknown",
    isp: ipInfo.isp || "unknown",
    as: ipInfo.as || "unknown",
    default_dns: readDefaultDns(),
    tools: {
      dig: commandExists("dig"),
      traceroute: commandExists("traceroute"),
      ping: commandExists("ping"),
      whois: commandExists("whois"),
    },
  };

  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(ENV_FILE, json, "utf8");
  process.stdout.write(json);
  console.error(`[env] Saved to ${ENV_FILE}`);
}

main().catch((error) => {
  console.error(`[env] ${error.message}`);
  process.exitCode = 1;
});
