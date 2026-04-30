#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

const DNS_SERVERS = {
  alidns_1: "223.5.5.5",
  alidns_2: "223.6.6.6",
  google_1: "8.8.8.8",
  google_2: "8.8.4.4",
};

const DOH_SERVERS = {
  alidns_doh: "https://dns.alidns.com/resolve",
  google_doh: "https://dns.google/resolve",
  cloudflare_doh: "https://cloudflare-dns.com/dns-query",
};

const RTYPE_MAP = new Map([
  [1, "A"],
  [28, "AAAA"],
  [5, "CNAME"],
  [15, "MX"],
  [16, "TXT"],
  [2, "NS"],
]);

export function parseDigAnswer(output) {
  const records = [];
  for (const rawLine of output.trim().split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) {
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length >= 5) {
      records.push({
        name: parts[0],
        ttl: /^\d+$/.test(parts[1]) ? Number.parseInt(parts[1], 10) : null,
        type: parts[3],
        value: parts[4],
        via: "udp",
      });
    }
  }
  return records;
}

export function digWithTtl(domain, dnsServer, recordType = "A", options = {}) {
  try {
    const result = spawnSync(
      options.command ?? "dig",
      [`@${dnsServer}`, domain, recordType, "+noall", "+answer", "+time=3", "+tries=1"],
      {
        encoding: "utf-8",
        timeout: options.timeoutMs ?? 8000,
      },
    );
    if (result.error) {
      throw result.error;
    }
    return parseDigAnswer(result.stdout ?? "");
  } catch {
    return [];
  }
}

export async function dohQuery(domain, dohUrl, recordType = "A", options = {}) {
  try {
    const url = new URL(dohUrl);
    url.searchParams.set("name", domain);
    url.searchParams.set("type", recordType);
    const response = await fetch(url, {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
    });
    const data = await response.json();
    const records = [];
    for (const answer of data.Answer ?? []) {
      records.push({
        name: answer.name ?? domain,
        ttl: answer.TTL,
        type: RTYPE_MAP.get(answer.type) ?? String(answer.type),
        value: String(answer.data ?? "").replace(/\.$/, ""),
        via: "doh",
      });
    }
    return records;
  } catch {
    return [];
  }
}

export function hasRealRecords(results) {
  for (const data of Object.values(results)) {
    for (const records of Object.values(data.records ?? {})) {
      if (records.some((record) => record.type === "A" || record.type === "AAAA")) {
        return true;
      }
    }
  }
  return false;
}

function summarizeResults(domain, results, dohUsed) {
  const allIps = new Set();
  const allCnames = [];
  for (const data of Object.values(results)) {
    for (const records of Object.values(data.records)) {
      for (const record of records) {
        if (record.type === "A" || record.type === "AAAA") {
          allIps.add(record.value);
        } else if (record.type === "CNAME") {
          allCnames.push(record.value);
        }
      }
    }
  }

  return {
    domain,
    unique_ips: [...allIps].sort(),
    cnames: [...new Map(allCnames.map((value) => [value, value])).values()],
    doh_used: dohUsed,
    by_dns: results,
  };
}

export async function run(domain, { asJson = false } = {}) {
  const results = {};
  await Promise.all(Object.entries(DNS_SERVERS).flatMap(([name, server]) =>
    ["A", "AAAA"].map(async (recordType) => {
      results[name] ??= { server, records: {}, method: "udp" };
      results[name].records[recordType] = digWithTtl(domain, server, recordType);
    }),
  ));

  let dohUsed = false;
  if (!hasRealRecords(results)) {
    console.error("[dig] UDP 查询返回空，回退到 DNS over HTTPS...");
    dohUsed = true;

    await Promise.all(Object.entries(DOH_SERVERS).flatMap(([name, url]) =>
      ["A", "AAAA"].map(async (recordType) => {
        results[name] ??= { server: url, records: {}, method: "doh" };
        results[name].records[recordType] = await dohQuery(domain, url, recordType);
      }),
    ));
  }

  const output = summarizeResults(domain, results, dohUsed);

  if (asJson) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    const methodTag = dohUsed ? " [via DoH]" : "";
    console.log(`\n=== DNS 查询: ${domain}${methodTag} ===`);
    if (output.cnames.length) {
      console.log(`CNAME 链: ${output.cnames.join(" → ")}`);
    }
    console.log(`唯一 IP:  ${output.unique_ips.join(", ") || "(none)"}\n`);
    for (const [name, data] of Object.entries(results).sort(([left], [right]) => left.localeCompare(right))) {
      console.log(`[${name}] ${data.server}  (${data.method ?? ""})`);
      for (const recordType of ["A", "AAAA", "CNAME"]) {
        for (const record of data.records[recordType] ?? []) {
          console.log(`  ${record.type.padEnd(6)} ${record.value.padEnd(45)} TTL=${record.ttl}`);
        }
      }
      console.log();
    }
  }

  return output;
}

export async function main(argv = process.argv.slice(2)) {
  const args = { domain: null, json: false };
  for (const arg of argv) {
    if (arg === "--json") {
      args.json = true;
    } else if (!args.domain) {
      args.domain = arg;
    } else {
      console.error(`Unexpected argument: ${arg}`);
      return 1;
    }
  }
  if (!args.domain) {
    console.error("Usage: node 01_dig.mjs <domain> [--json]");
    return 1;
  }

  await run(args.domain, { asJson: args.json });
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
