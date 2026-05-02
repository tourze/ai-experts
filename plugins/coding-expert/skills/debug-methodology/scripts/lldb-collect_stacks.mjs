#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";

function usage() {
  return `collect_stacks.mjs --pid <pid> [--out <prefix>] [--repeat <n>] [--sleep <seconds>]
collect_stacks.mjs --name <process-substring> [--out <prefix>] [--repeat <n>] [--sleep <seconds>]

Examples:
  collect_stacks.mjs --pid 12345 --out /tmp/hang --repeat 3 --sleep 0.5
  collect_stacks.mjs --name "my-app" --out /tmp/hang`;
}

function die(message) {
  console.error(message);
  console.error(usage());
  return 1;
}

function requireValue(flag, value) {
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return value;
}

function parseArgs(argv) {
  const args = {
    pid: "",
    name: "",
    out: "stack",
    repeat: "1",
    sleep: "0.5",
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--pid") {
      args.pid = requireValue(arg, argv[++i]);
    } else if (arg === "--name") {
      args.name = requireValue(arg, argv[++i]);
    } else if (arg === "--out") {
      args.out = requireValue(arg, argv[++i]);
    } else if (arg === "--repeat") {
      args.repeat = requireValue(arg, argv[++i]);
    } else if (arg === "--sleep") {
      args.sleep = requireValue(arg, argv[++i]);
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else {
      throw new Error(`Unknown arg: ${arg}`);
    }
  }

  return args;
}

function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  return spawnSync(checker, [command], { stdio: "ignore" }).status === 0;
}

function findPidByName(name) {
  if (!name || !commandExists("pgrep")) {
    return "";
  }
  const result = spawnSync("pgrep", ["-n", "-f", name], {
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : "";
}

function stamp() {
  const value = new Date();
  const pad = (number) => String(number).padStart(2, "0");
  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}_${pad(value.getHours())}${pad(value.getMinutes())}${pad(value.getSeconds())}`;
}

function sleep(seconds) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, Number(seconds) * 1000));
}

function runDebugger(debuggerName, pid) {
  if (debuggerName === "lldb") {
    return spawnSync("lldb", ["-p", pid, "-o", "thread backtrace all", "-o", "detach", "-o", "quit"], {
      encoding: "utf8",
    });
  }
  return spawnSync("gdb", ["-q", "-p", pid, "-ex", "thread apply all bt", "-ex", "detach", "-ex", "quit"], {
    encoding: "utf8",
  });
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    return die(error.message);
  }

  if (args.help) {
    console.log(usage());
    return 0;
  }

  if (args.pid && !/^[1-9][0-9]*$/.test(args.pid)) {
    return die("--pid must be a positive integer.");
  }
  if (!/^0*[0-9]+$/.test(args.repeat) || Number(args.repeat) < 1) {
    return die("--repeat must be an integer greater than or equal to 1.");
  }
  if (!/^([0-9]+([.][0-9]+)?|[.][0-9]+)$/.test(args.sleep)) {
    return die("--sleep must be a non-negative number.");
  }

  const pid = args.pid || findPidByName(args.name);
  if (!pid) {
    return die("Missing --pid (or --name did not match any process).");
  }

  let debuggerName = "";
  if (commandExists("lldb")) {
    debuggerName = "lldb";
  } else if (commandExists("gdb")) {
    debuggerName = "gdb";
  } else {
    console.error("No lldb or gdb found in PATH.");
    return 2;
  }

  const capturedAt = stamp();
  mkdirSync(dirname(args.out), { recursive: true });
  for (let i = 1; i <= Number(args.repeat); i += 1) {
    const file = `${args.out}_${pid}_${capturedAt}_${i}.txt`;
    console.log(`[${debuggerName}] pid=${pid} -> ${file}`);
    const result = runDebugger(debuggerName, pid);
    writeFileSync(file, `${result.stdout || ""}${result.stderr || ""}`, "utf8");
    if (i < Number(args.repeat)) {
      await sleep(args.sleep);
    }
  }

  return 0;
}

process.exitCode = await main();
