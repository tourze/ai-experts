#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import net from "node:net";
import { performance } from "node:perf_hooks";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

export function parseIcmpOutput(output, host, count) {
  const rttMatch = output.match(/rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)/);
  const lossMatch = output.match(/(\d+)% packet loss/);
  const recvMatch = output.match(/(\d+) received/);

  return {
    method: "icmp",
    host,
    count,
    packet_loss_pct: lossMatch ? Number.parseInt(lossMatch[1], 10) : null,
    received: recvMatch ? Number.parseInt(recvMatch[1], 10) : null,
    rtt_min_ms: rttMatch ? Number.parseFloat(rttMatch[1]) : null,
    rtt_avg_ms: rttMatch ? Number.parseFloat(rttMatch[2]) : null,
    rtt_max_ms: rttMatch ? Number.parseFloat(rttMatch[3]) : null,
    rtt_mdev_ms: rttMatch ? Number.parseFloat(rttMatch[4]) : null,
    raw: output.trim(),
  };
}

export function pingIcmp(host, count = 5, options = {}) {
  try {
    const result = spawnSync(options.command ?? "ping", ["-c", String(count), "-W", "3", host], {
      encoding: "utf-8",
      timeout: options.timeoutMs ?? 30_000,
    });
    if (result.error) {
      throw result.error;
    }
    return parseIcmpOutput(`${result.stdout}${result.stderr}`, host, count);
  } catch (error) {
    return { method: "icmp", host, error: error.message };
  }
}

function connectOnce(host, port, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const socket = net.createConnection({ host, port });
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      const rtt = performance.now() - start;
      socket.destroy();
      resolve(Math.round(rtt * 1000) / 1000);
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
    socket.once("error", (error) => {
      socket.destroy();
      reject(error);
    });
  });
}

export async function pingTcp(host, port, count = 5, options = {}) {
  const rtts = [];
  const errors = [];
  for (let index = 0; index < count; index += 1) {
    try {
      rtts.push(await connectOnce(host, port, options.timeoutMs ?? 3000));
    } catch (error) {
      errors.push(error.message);
    }
    if (index < count - 1) {
      await sleep(options.delayMs ?? 200);
    }
  }

  const result = {
    method: "tcp",
    host,
    port,
    count,
    success: rtts.length,
    failed: errors.length,
    packet_loss_pct: Math.round((errors.length / count) * 100),
  };

  if (rtts.length) {
    result.rtt_min_ms = Math.min(...rtts);
    result.rtt_avg_ms = Math.round((rtts.reduce((sum, value) => sum + value, 0) / rtts.length) * 1000) / 1000;
    result.rtt_max_ms = Math.max(...rtts);
    result.rtts = rtts;
  }
  if (errors.length) {
    result.errors = errors.slice(0, 3);
  }
  return result;
}

export async function run(host, { count = 5, tcpPorts = null, asJson = false } = {}) {
  const entries = [["icmp", Promise.resolve(pingIcmp(host, count))]];
  for (const port of tcpPorts ?? []) {
    entries.push([`tcp_${port}`, pingTcp(host, port, count)]);
  }

  const results = {};
  for (const [key, promise] of entries) {
    results[key] = await promise;
  }

  const output = { host, results };
  if (asJson) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`\n=== Ping/延迟探测: ${host} ===\n`);
    for (const [key, result] of Object.entries(results)) {
      const method = (result.method ?? key).toUpperCase();
      if (result.error) {
        console.log(`  [${method}] ERROR: ${result.error}`);
        continue;
      }
      const port = result.port ? `:${result.port}` : "";
      const loss = result.packet_loss_pct ?? "?";
      const avg = result.rtt_avg_ms ?? "?";
      const min = result.rtt_min_ms ?? "?";
      const max = result.rtt_max_ms ?? "?";
      console.log(`  [${method}${port}] loss=${loss}%  min=${min}ms  avg=${avg}ms  max=${max}ms`);
    }
    console.log();
  }

  return output;
}

function parseArgs(argv) {
  const args = { host: null, count: 5, tcpPorts: [], json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--count" || arg === "--tcp-port") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed)) {
        throw new Error(`${arg} must be an integer`);
      }
      if (arg === "--count") {
        args.count = parsed;
      } else {
        args.tcpPorts.push(parsed);
      }
    } else if (!args.host) {
      args.host = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return 1;
  }
  if (!args.host) {
    console.error("Usage: node 05_ping.mjs <host> [--count 5] [--tcp-port 80] [--json]");
    return 1;
  }

  await run(args.host, {
    count: args.count,
    tcpPorts: args.tcpPorts.length ? args.tcpPorts : [80, 443],
    asJson: args.json,
  });
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
