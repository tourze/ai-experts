#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isPrivateIp } from "./02_ip_info.mjs";

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url));
const LEGACY_ENV_FILE = join(os.homedir(), ".site-analyzer-env.json");
const MODERN_ENV_FILE = join(os.homedir(), ".site-analyze", "env.json");

export function normalizeEnv(raw) {
  if (!raw || typeof raw !== "object") return {};
  if ("my_ip" in raw) return raw;

  const exitIp = raw.exit_ip || {};
  return {
    my_ip: exitIp.ip,
    country: exitIp.country,
    city: exitIp.city,
    isp: exitIp.org,
  };
}

export function resolveDomain(target) {
  if (/^https?:\/\//i.test(target)) {
    try {
      return new URL(target).hostname;
    } catch {
      return target;
    }
  }
  return target;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

export function loadEnv() {
  const envFile = existsSync(MODERN_ENV_FILE) ? MODERN_ENV_FILE : LEGACY_ENV_FILE;
  if (!existsSync(envFile)) return {};
  return normalizeEnv(readJson(envFile));
}

async function runNodeJson(scriptName, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(SCRIPT_DIR, scriptName), ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ error: error.message });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code !== 0) {
        const detail = stderr.trim() || stdout.trim() || signal || `exit ${code}`;
        resolve({ error: detail });
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        resolve({ error: `invalid JSON from ${scriptName}: ${error.message}` });
      }
    });
  });
}

export function runWhoisNode(target) {
  return runNodeJson("04_whois.mjs", [target, "--json"], 20000);
}

export function runDigNode(target) {
  return runNodeJson("01_dig.mjs", [target, "--json"], 25000);
}

export function runPingNode(target, count = 5, ports = []) {
  const args = [target, "--count", String(count), "--json"];
  for (const port of ports) {
    args.push("--tcp-port", String(port));
  }
  return runNodeJson("05_ping.mjs", args, 40000);
}

export function runIpInfoNode(ips) {
  if (!ips.length) return {};
  return runNodeJson("02_ip_info.mjs", ["--json", ...ips], 20000);
}

export function runTracerouteNode(target, maxHops = 20) {
  return runNodeJson("03_traceroute.mjs", [target, "--max-hops", String(maxHops), "--json"], 130000);
}

export function runRobotsNode(target) {
  return runNodeJson("06_robots.mjs", [target, "--json"], 20000);
}

export async function checkEnv() {
  if (!existsSync(MODERN_ENV_FILE) && !existsSync(LEGACY_ENV_FILE)) {
    console.error("[setup] First run: probing network environment...");
    await runNodeJson("00_probe_env.mjs", [], 30000);
  }
  return loadEnv();
}

export function shouldProbePath(ipsToProbe, noTraceroute) {
  if (!ipsToProbe.length || noTraceroute) return false;
  const first = ipsToProbe[0];
  return net.isIP(first) ? !isPrivateIp(first) : true;
}

export async function run(target, { asJson = false, noTraceroute = false, noRobots = false, pingPorts = null } = {}) {
  const start = Date.now();
  const env = await checkEnv();
  const isIp = net.isIP(target) !== 0;
  const domain = resolveDomain(target);
  const report = {
    target,
    domain,
    is_ip: isIp,
    probe_host: {
      ip: env.my_ip,
      country: env.country,
      city: env.city,
      isp: env.isp,
    },
    phases: {},
  };

  console.error("\n[Phase 1] dig / whois / robots...");
  const phase1Entries = [];
  if (!isIp) phase1Entries.push(["dig", runDigNode(domain)]);
  phase1Entries.push(["whois", runWhoisNode(domain)]);
  if (!noRobots && !isIp) phase1Entries.push(["robots", runRobotsNode(domain)]);

  const phase1 = {};
  for (const [key, promise] of phase1Entries) {
    try {
      phase1[key] = await promise;
    } catch (error) {
      phase1[key] = { error: error.message };
    }
  }
  report.phases.phase1 = phase1;

  let ipsToProbe = [];
  if (isIp) {
    ipsToProbe = [target];
    report.ip_info = await runIpInfoNode([target]);
  } else {
    ipsToProbe = (phase1.dig?.unique_ips || []).slice(0, 4);
    if (ipsToProbe.length) {
      report.ip_info = await runIpInfoNode(ipsToProbe);
    }
  }
  console.error(`  IPs to probe: ${ipsToProbe.join(", ") || "(none)"}`);

  if (shouldProbePath(ipsToProbe, noTraceroute)) {
    console.error("\n[Phase 2] traceroute + ping...");
    const probeIp = ipsToProbe[0];
    const ports = pingPorts || [80, 443];
    const [traceroute, ping] = await Promise.all([
      runTracerouteNode(probeIp, 20),
      runPingNode(probeIp, 5, ports),
    ]);
    report.phases.phase2 = { traceroute, ping };
  } else if (ipsToProbe.length && !noTraceroute) {
    report.phases.phase2 = { note: "目标为私网地址，跳过 traceroute 与 ping" };
  }

  report.elapsed_sec = Math.round(((Date.now() - start) / 1000) * 10) / 10;

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  return report;
}

function printReport(report) {
  const target = report.target;
  const probe = report.probe_host || {};
  const ipInfoMap = report.ip_info || {};
  const phase1 = report.phases.phase1 || {};
  const phase2 = report.phases.phase2 || {};

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  站点分析报告: ${target}`);
  console.log(`  探测节点: ${probe.ip || "?"} (${probe.city || "?"}, ${probe.country || "?"} · ${probe.isp || "?"})`);
  console.log(`${"=".repeat(60)}\n`);

  if (Object.keys(ipInfoMap).length) {
    console.log("【IP 归属】");
    for (const [ip, info] of Object.entries(ipInfoMap)) {
      if (info.private) continue;
      const country = info.country || "?";
      const city = info.city || "?";
      const org = info.org || info.isp || "?";
      const asn = info.as || "";
      console.log(`  ${ip.padEnd(20)}  ${country} · ${city}`);
      console.log(`  ${"".padEnd(20)}  ${org}  ${asn}`);
    }
    console.log("");
  }

  const dig = phase1.dig || {};
  if (dig && !dig.error) {
    console.log("【DNS 解析】");
    const uniqueIps = dig.unique_ips || [];
    console.log(`  唯一 IP: ${uniqueIps.join(", ")}`);
    const cnIps = new Set();
    const globalIps = new Set();
    for (const [name, data] of Object.entries(dig.by_dns || {})) {
      for (const record of data.records?.A || []) {
        if (record.type !== "A") continue;
        if (name.includes("alidns")) cnIps.add(record.value);
        else globalIps.add(record.value);
      }
    }
    if (cnIps.size && globalIps.size && [...cnIps].sort().join(",") !== [...globalIps].sort().join(",")) {
      console.log("  国内/国外 DNS 返回不同 IP（可能有 GeoDNS 或 CDN）");
      console.log(`     国内(Ali): ${[...cnIps].sort().join(", ")}`);
      console.log(`     国外(Global): ${[...globalIps].sort().join(", ")}`);
    } else {
      console.log("  DNS 一致（国内外解析相同）");
    }
    console.log("");
  }

  const whois = phase1.whois || {};
  if (whois && !whois.error) {
    console.log("【WHOIS】");
    for (const field of ["registrar", "creation_date", "expiry_date", "registrant_org", "registrant_country", "netname", "orgname", "descr", "inetnum", "country"]) {
      if (whois[field]) console.log(`  ${field.padEnd(22)}: ${whois[field]}`);
    }
    if (whois.name_servers?.length) {
      console.log(`  ${"name_servers".padEnd(22)}: ${whois.name_servers.slice(0, 4).join(", ")}`);
    }
    console.log("");
  }

  const robots = phase1.robots || {};
  if (robots && !robots.error) {
    const fetch = robots.fetch || {};
    console.log("【robots.txt】");
    console.log(`  HTTP ${fetch.status_code || "?"}: ${fetch.final_url || ""}`);
    if (robots.summary) console.log(robots.summary);
    else if (robots.note) console.log(`  ${robots.note}`);
    console.log("");
  }

  const ping = phase2.ping || {};
  if (ping && !ping.error) {
    console.log("【延迟探测】");
    for (const result of Object.values(ping.results || {})) {
      if (result.error) continue;
      const method = String(result.method || "").toUpperCase();
      const port = result.port ? `:${result.port}` : "";
      console.log(`  [${method}${port}] loss=${result.packet_loss_pct ?? "?"}%  min=${result.rtt_min_ms ?? "?"}ms  avg=${result.rtt_avg_ms ?? "?"}ms  max=${result.rtt_max_ms ?? "?"}ms`);
    }
    console.log("");
  }

  console.log("【站点画像】");
  generatePortrait(ipInfoMap, dig, whois);
  console.log(`\n耗时: ${report.elapsed_sec ?? "?"}s`);
}

function generatePortrait(ipInfoMap, dig, whois) {
  const cnIps = new Set();
  const globalIps = new Set();
  for (const [name, data] of Object.entries(dig?.by_dns || {})) {
    for (const record of data.records?.A || []) {
      if (record.type !== "A") continue;
      if (name.includes("alidns")) cnIps.add(record.value);
      else globalIps.add(record.value);
    }
  }

  if (cnIps.size && globalIps.size && [...cnIps].sort().join(",") !== [...globalIps].sort().join(",")) {
    console.log("  GeoDNS / CDN：国内外解析到不同 IP，存在流量调度");
  } else {
    console.log("  DNS：无 GeoDNS，全球统一入口");
  }

  const locations = new Set();
  for (const info of Object.values(ipInfoMap || {})) {
    if (info.country && info.city) {
      locations.add(`${info.country} · ${info.city} (${info.org || info.isp || ""})`);
    }
  }
  for (const location of locations) {
    console.log(`  机房: ${location}`);
  }

  if (whois?.registrar) console.log(`  注册商: ${whois.registrar}`);
  if (whois?.registrant_country) console.log(`  注册地: ${whois.registrant_country}`);
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { target: null, json: false, noTraceroute: false, noRobots: false, pingPorts: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") args.json = true;
    else if (arg === "--no-traceroute") args.noTraceroute = true;
    else if (arg === "--no-robots") args.noRobots = true;
    else if (arg === "--tcp-port") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error("--tcp-port requires a value");
      args.pingPorts.push(Number.parseInt(value, 10));
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (!args.target) {
      args.target = arg;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help || !args.target) {
    console.log("Usage: node analyze.mjs <domain_or_ip> [--json] [--no-traceroute] [--no-robots] [--tcp-port <port>]");
    return args.help ? 0 : 1;
  }
  await run(args.target, {
    asJson: args.json,
    noTraceroute: args.noTraceroute,
    noRobots: args.noRobots,
    pingPorts: args.pingPorts.length ? args.pingPorts : null,
  });
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
