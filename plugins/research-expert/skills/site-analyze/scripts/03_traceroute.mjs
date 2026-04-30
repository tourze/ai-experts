#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isPrivateIp, queryIps } from "./02_ip_info.mjs";
import { realpathSync } from "node:fs";

export function runTraceroute(target, maxHops = 20, options = {}) {
  try {
    const result = spawnSync(options.command ?? "traceroute", ["-n", "-m", String(maxHops), target], {
      encoding: "utf-8",
      timeout: options.timeoutMs ?? 120_000,
    });
    if (result.error) {
      throw result.error;
    }
    return result.stdout ?? "";
  } catch (error) {
    return error?.code === "ETIMEDOUT" ? "" : `ERROR: ${error.message}`;
  }
}

export function parseTraceroute(rawOutput) {
  const hops = [];
  for (const rawLine of rawOutput.trim().split(/\r?\n/)) {
    if (rawLine.toLowerCase().startsWith("traceroute ")) {
      continue;
    }

    const match = rawLine.match(/^\s*(\d+)\s+(.*)/);
    if (!match) {
      continue;
    }

    const hopNum = Number.parseInt(match[1], 10);
    const rest = match[2];
    const ips = [...new Map([...rest.matchAll(/(\d+\.\d+\.\d+\.\d+)/g)].map((item) => [item[1], item[1]])).values()];
    const latencies = [...rest.matchAll(/(\d+\.\d+)\s*ms/g)].map((item) => Number.parseFloat(item[1]));
    hops.push({
      hop: hopNum,
      ips,
      latencies_ms: latencies,
      avg_ms: latencies.length ? Math.round((latencies.reduce((sum, value) => sum + value, 0) / latencies.length) * 1000) / 1000 : null,
      timeout: ips.length === 0,
      raw: rawLine.trim(),
    });
  }
  return hops;
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

export async function run(target, { maxHops = 20, asJson = false, parseStdin = false, stdinText = null } = {}) {
  let raw;
  if (parseStdin) {
    raw = stdinText ?? await readStdin();
  } else {
    console.error(`[traceroute] Running traceroute to ${target} (max ${maxHops} hops)...`);
    raw = runTraceroute(target, maxHops);
  }

  if (!raw || raw.startsWith("ERROR")) {
    const result = { target, error: raw || "empty traceroute output" };
    if (asJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`Traceroute failed: ${result.error}`);
    }
    return result;
  }

  const hops = parseTraceroute(raw);
  console.error(`[traceroute] Querying IP info for ${hops.reduce((sum, hop) => sum + hop.ips.length, 0)} IPs...`);
  const allPublicIps = [];
  for (const hop of hops) {
    for (const ip of hop.ips) {
      if (!isPrivateIp(ip)) {
        allPublicIps.push(ip);
      }
    }
  }
  const uniquePublicIps = [...new Map(allPublicIps.map((ip) => [ip, ip])).values()];
  const ipInfoMap = uniquePublicIps.length ? await queryIps(uniquePublicIps) : {};

  for (const hop of hops) {
    hop.ip_info = [];
    for (const ip of hop.ips) {
      const info = ipInfoMap[ip] ?? {};
      hop.ip_info.push({
        ip,
        private: info.private ?? isPrivateIp(ip),
        country: info.country,
        city: info.city,
        org: info.org ?? info.isp,
        as: info.as,
      });
    }
  }

  const result = { target, hops, raw };
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n=== Traceroute: ${target} ===\n`);
    for (const hop of hops) {
      if (hop.timeout) {
        console.log(`  ${String(hop.hop).padStart(2)}  * * * (timeout)`);
        continue;
      }
      const latencyText = hop.avg_ms ? `${hop.avg_ms}ms` : "?ms";
      hop.ips.forEach((ip, index) => {
        const info = hop.ip_info[index] ?? {};
        const loc = info.private
          ? "内网"
          : [info.country, info.city].filter(Boolean).join(" · ") || "?";
        const org = info.private ? "" : info.org ?? info.as ?? "";
        const latency = index === 0 ? latencyText : "";
        console.log(`  ${String(hop.hop).padStart(2)}  ${ip.padEnd(20)}  ${latency.padEnd(10)}  ${loc}  ${org}`);
      });
    }
    console.log();
  }

  return result;
}

export async function main(argv = process.argv.slice(2)) {
  const args = { target: null, maxHops: 20, json: false, parseText: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--parse-text") {
      args.parseText = true;
    } else if (arg === "--max-hops") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        console.error("--max-hops requires a value");
        return 1;
      }
      index += 1;
      args.maxHops = Number.parseInt(value, 10);
      if (!Number.isInteger(args.maxHops)) {
        console.error("--max-hops must be an integer");
        return 1;
      }
    } else if (!args.target) {
      args.target = arg;
    } else {
      console.error(`Unexpected argument: ${arg}`);
      return 1;
    }
  }

  if (args.parseText) {
    await run("(stdin)", { maxHops: args.maxHops, asJson: args.json, parseStdin: true });
    return 0;
  }
  if (args.target) {
    await run(args.target, { maxHops: args.maxHops, asJson: args.json });
    return 0;
  }

  console.error("Usage: node 03_traceroute.mjs <target> [--max-hops 20] [--json]");
  console.error("       node 03_traceroute.mjs --parse-text < traceroute_output.txt");
  return 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
