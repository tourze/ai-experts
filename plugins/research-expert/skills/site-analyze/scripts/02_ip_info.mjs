#!/usr/bin/env node
import net from "node:net";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

export async function queryIpApi(ip, options = {}) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 6000),
    });
    const data = await response.json();
    if (data.status === "success") {
      return {
        source: "ip-api",
        ip,
        country: data.country,
        country_code: data.countryCode,
        region: data.regionName,
        city: data.city,
        isp: data.isp,
        org: data.org,
        as: data.as,
        lat: data.lat,
        lon: data.lon,
      };
    }
  } catch {
    // Fall through to the same failure shape as the Python implementation.
  }
  return { source: "ip-api", ip, error: "failed" };
}

export async function queryIpinfo(ip, options = {}) {
  try {
    const response = await fetch(`https://ipinfo.io/${ip}/json`, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 6000),
    });
    const data = await response.json();
    if (data.ip) {
      const [lat, lon] = String(data.loc ?? ",").split(",");
      return {
        source: "ipinfo",
        ip,
        country: data.country,
        region: data.region,
        city: data.city,
        org: data.org,
        hostname: data.hostname,
        lat: lat ? Number.parseFloat(lat) : null,
        lon: lon ? Number.parseFloat(lon) : null,
      };
    }
  } catch {
    // Fall through to the same failure shape as the Python implementation.
  }
  return { source: "ipinfo", ip, error: "failed" };
}

export function mergeInfo(ipApi, ipinfo) {
  const merged = { ip: ipApi.ip ?? ipinfo.ip };
  for (const key of ["country", "country_code", "region", "city", "isp", "org", "as", "lat", "lon", "hostname"]) {
    const value = ipApi[key] ?? ipinfo[key];
    if (value !== undefined && value !== null) {
      merged[key] = value;
    }
  }
  merged._sources = { ip_api: ipApi, ipinfo };
  return merged;
}

export function isPrivateIp(ip) {
  const ipVersion = net.isIP(ip);
  if (ipVersion === 6) {
    const lower = ip.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe8");
  }
  if (ipVersion !== 4) {
    return false;
  }

  const [a, b, c, d] = ip.split(".").map((part) => Number.parseInt(part, 10));
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 192 && b === 0 && c === 0 && d !== 9 && d !== 10) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

export async function queryIps(ips) {
  const results = {};
  const publicIps = ips.filter((ip) => !isPrivateIp(ip));
  const privateIps = ips.filter((ip) => isPrivateIp(ip));

  for (const ip of privateIps) {
    results[ip] = { ip, private: true, note: "内网/私有地址" };
  }

  const apiResults = {};
  const infoResults = {};
  const tasks = publicIps.flatMap((ip) => [
    async () => {
      apiResults[ip] = await queryIpApi(ip);
    },
    async () => {
      infoResults[ip] = await queryIpinfo(ip);
    },
  ]);
  for (let index = 0; index < tasks.length; index += 20) {
    await Promise.all(tasks.slice(index, index + 20).map((task) => task()));
  }

  for (const ip of publicIps) {
    results[ip] = mergeInfo(
      apiResults[ip] ?? { ip, error: "no data" },
      infoResults[ip] ?? { ip, error: "no data" },
    );
  }

  return results;
}

export async function run(ips, { asJson = false } = {}) {
  const results = await queryIps(ips);

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const [ip, info] of Object.entries(results)) {
      if (info.private) {
        console.log(`[${ip}] 私有地址`);
        continue;
      }
      const country = info.country ?? "?";
      const city = info.city ?? "?";
      const region = info.region ?? "?";
      const org = info.org ?? info.isp ?? "?";
      const asn = info.as ?? "";
      console.log(`[${ip}]`);
      console.log(`  位置: ${country} · ${region} · ${city}`);
      console.log(`  组织: ${org}`);
      if (asn) {
        console.log(`  ASN:  ${asn}`);
      }
      console.log();
    }
  }

  return results;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

export async function main(argv = process.argv.slice(2)) {
  const args = { ips: [], stdin: false, json: false };
  for (const arg of argv) {
    if (arg === "--stdin") {
      args.stdin = true;
    } else if (arg === "--json") {
      args.json = true;
    } else {
      args.ips.push(arg);
    }
  }

  if (args.stdin) {
    const stdinText = await readStdin();
    args.ips.push(...stdinText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  }

  if (!args.ips.length) {
    console.error("Usage: node 02_ip_info.mjs <ip1> [ip2 ...] [--json]");
    return 1;
  }

  await run(args.ips, { asJson: args.json });
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
