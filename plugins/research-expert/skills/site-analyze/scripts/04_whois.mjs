#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

const PATTERNS = {
  registrar: /Registrar:\s*(.+)/gi,
  registrar_url: /Registrar URL:\s*(.+)/gi,
  creation_date: /Creation Date:\s*(.+)/gi,
  expiry_date: /(?:Registry Expiry Date|Expiration Date):\s*(.+)/gi,
  updated_date: /Updated Date:\s*(.+)/gi,
  status: /Domain Status:\s*(.+)/gi,
  name_servers: /Name Server:\s*(.+)/gi,
  registrant_org: /Registrant Organization:\s*(.+)/gi,
  registrant_country: /Registrant Country:\s*(.+)/gi,
  admin_email: /(?:Admin Email|Registrant Email):\s*(.+)/gi,
  netname: /NetName:\s*(.+)/gi,
  orgname: /OrgName:\s*(.+)/gi,
  org: /^org:\s*(.+)/gim,
  descr: /^descr:\s*(.+)/gim,
  country: /^country:\s*(.+)/gim,
  inetnum: /inetnum:\s*(.+)/gi,
  cidr: /CIDR:\s*(.+)/gi,
  abuse_email: /(?:OrgAbuseEmail|abuse-mailbox):\s*(.+)/gi,
};

const MULTI_FIELDS = new Set(["status", "name_servers"]);

export function runWhois(target, options = {}) {
  const command = options.command ?? "whois";
  const result = spawnSync(command, [target], {
    encoding: "utf-8",
    timeout: options.timeoutMs ?? 15_000,
  });

  if (result.error) {
    return `ERROR: ${result.error.message}`;
  }
  return result.stdout;
}

export function parseWhois(raw, target) {
  const info = {
    target,
    raw_length: raw.length,
  };

  for (const [key, pattern] of Object.entries(PATTERNS)) {
    const matches = [...raw.matchAll(pattern)].map((match) => match[1].trim());
    if (!matches.length) {
      continue;
    }
    if (MULTI_FIELDS.has(key)) {
      info[key] = [...new Set(matches)].slice(0, 5);
    } else {
      info[key] = matches[0];
    }
  }

  return info;
}

export function run(target, asJson = false, options = {}) {
  const raw = options.raw ?? runWhois(target, options);
  const result = raw.startsWith("ERROR")
    ? { target, error: raw }
    : { ...parseWhois(raw, target), raw };

  if (asJson) {
    const { raw: _raw, ...publicResult } = result;
    console.log(JSON.stringify(publicResult, null, 2));
  } else {
    console.log(`\n=== WHOIS: ${target} ===\n`);
    for (const [key, value] of Object.entries(result)) {
      if (["target", "raw", "raw_length"].includes(key)) {
        continue;
      }
      if (Array.isArray(value)) {
        console.log(`  ${key}: ${value.join(", ")}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    console.log();
  }

  return result;
}

function parseArgs(argv) {
  const args = { target: null, json: false };
  for (const arg of argv) {
    if (arg === "--json") {
      args.json = true;
    } else if (!args.target) {
      args.target = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return 1;
  }
  if (!args.target) {
    console.error("Usage: node 04_whois.mjs <domain_or_ip> [--json]");
    return 1;
  }

  run(args.target, args.json);
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
