#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ADB_PATH, resolveSerial, runAdbCommand } from "./common";

export function sanitizeFilePart(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "app";
}

export function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function defaultOutputDir(packageName, date = new Date()) {
  return resolve(`android-diagnose-${sanitizeFilePart(packageName)}-${timestampForPath(date)}`);
}

export function buildLaunchCommand(packageName, activity = null) {
  if (activity) {
    return ["shell", "am", "start", "-n", `${packageName}/${activity}`];
  }
  return ["shell", "monkey", "-p", packageName, "-c", "android.intent.category.LAUNCHER", "1"];
}

export function buildLogcatDumpCommand({ tail = 500, pid = null } = {}) {
  const command = ["logcat", "-d", "-v", "time", "-t", String(tail)];
  if (pid) command.push(`--pid=${pid}`);
  return command;
}

export function buildAdbInvocation(command, serial = null) {
  const args = [];
  if (serial) args.push("-s", serial);
  args.push(...command);
  return [ADB_PATH, ...args];
}

export function filterLines(text, pattern = null) {
  if (!pattern) return text;
  return text
    .split(/\r?\n/)
    .filter((line) => line.includes(pattern))
    .join("\n");
}

function usage() {
  return `Capture an Android app diagnosis bundle.

Usage: node scripts/diagnose_app.mjs --package <name> [options]

Options:
  --package <name>       Package name to diagnose
  --activity <activity>  Activity to launch with am start
  --out <dir>            Output directory
  --grep <pattern>       Keep matching logcat lines
  --tail <lines>         Logcat line window (default: 500)
  --wait-ms <ms>         Wait after launch before collecting evidence (default: 3000)
  --force-stop           Force-stop the package before launch
  --no-clear-logcat      Do not clear logcat before launch
  --no-launch            Skip launch and collect current state only
  --serial, -s <serial>  Device serial
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    packageName: null,
    activity: null,
    out: null,
    grep: null,
    tail: 500,
    waitMs: 3000,
    forceStop: false,
    clearLogcat: true,
    launch: true,
    serial: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--force-stop") {
      args.forceStop = true;
      continue;
    }
    if (arg === "--no-clear-logcat") {
      args.clearLogcat = false;
      continue;
    }
    if (arg === "--no-launch") {
      args.launch = false;
      continue;
    }
    if (["--package", "--activity", "--out", "--grep", "--tail", "--wait-ms", "--serial", "-s"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--package") args.packageName = value;
      if (arg === "--activity") args.activity = value;
      if (arg === "--out") args.out = value;
      if (arg === "--grep") args.grep = value;
      if (arg === "--tail") args.tail = Number.parseInt(value, 10);
      if (arg === "--wait-ms") args.waitMs = Number.parseInt(value, 10);
      if (arg === "--serial" || arg === "-s") args.serial = value;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }

  if (!args.help && !args.packageName) throw new Error("--package is required");
  if (!Number.isInteger(args.tail) || args.tail <= 0) throw new Error("--tail must be a positive integer");
  if (!Number.isInteger(args.waitMs) || args.waitMs < 0) throw new Error("--wait-ms must be a non-negative integer");
  return args;
}

function writeText(outDir, name, text) {
  const filePath = join(outDir, name);
  writeFileSync(filePath, text);
  return filePath;
}

function runTextEvidence(label, command, serial, outDir, fileName, summary) {
  const result = runAdbCommand(command, serial, { check: false });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const output = `${stdout}${stderr}`;
  const status = result.status ?? 1;
  summary.commands.push({ label, command: buildAdbInvocation(command, serial).join(" "), status });
  summary.files[label] = writeText(outDir, fileName, output);
  if (status !== 0) {
    summary.errors.push({ label, message: output || `adb exited with code ${status}` });
  }
  return { output, stdout, stderr, status };
}

function runBinaryEvidence(label, command, serial, outDir, fileName, summary) {
  const invocation = buildAdbInvocation(command, serial);
  const result = spawnSync(invocation[0], invocation.slice(1));
  const status = result.status ?? 1;
  summary.commands.push({ label, command: invocation.join(" "), status });
  if (status === 0 && result.stdout?.length) {
    const filePath = join(outDir, fileName);
    writeFileSync(filePath, result.stdout);
    summary.files[label] = filePath;
    return true;
  }
  summary.errors.push({ label, message: String(result.stderr ?? result.stdout ?? `adb exited with code ${status}`) });
  return false;
}

export async function main(argv = process.argv.slice(2), sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }

  const serial = resolveSerial(args.serial);
  const outDir = args.out ? resolve(args.out) : defaultOutputDir(args.packageName);
  mkdirSync(outDir, { recursive: true });

  const summary = {
    packageName: args.packageName,
    serial,
    outDir,
    startedAt: new Date().toISOString(),
    commands: [],
    files: {},
    errors: [],
  };

  if (args.clearLogcat) {
    runTextEvidence("clearLogcat", ["logcat", "-c"], serial, outDir, "logcat-clear.txt", summary);
  }
  if (args.forceStop) {
    runTextEvidence("forceStop", ["shell", "am", "force-stop", args.packageName], serial, outDir, "force-stop.txt", summary);
  }
  if (args.launch) {
    runTextEvidence("launch", buildLaunchCommand(args.packageName, args.activity), serial, outDir, "launch.txt", summary);
    if (args.waitMs) await sleep(args.waitMs);
  }

  const pidResult = runTextEvidence("pidof", ["shell", "pidof", args.packageName], serial, outDir, "pidof.txt", summary);
  const pid = pidResult.stdout.trim();
  summary.pid = pid || null;
  const logcat = runTextEvidence(
    "logcat",
    buildLogcatDumpCommand({ tail: args.tail, pid: summary.pid }),
    serial,
    outDir,
    "logcat.txt",
    summary,
  );
  if (args.grep) {
    summary.files.logcatFiltered = writeText(outDir, "logcat-filtered.txt", filterLines(logcat.output, args.grep));
  }

  runTextEvidence("dumpsysWindow", ["shell", "dumpsys", "window"], serial, outDir, "dumpsys-window.txt", summary);
  runTextEvidence("dumpsysActivity", ["shell", "dumpsys", "activity", "top"], serial, outDir, "dumpsys-activity-top.txt", summary);
  runBinaryEvidence("screenshot", ["exec-out", "screencap", "-p"], serial, outDir, "screen.png", summary);

  runTextEvidence("uiDump", ["shell", "uiautomator", "dump", "/sdcard/window_dump.xml"], serial, outDir, "uiautomator-dump.txt", summary);
  runTextEvidence("uiXml", ["exec-out", "cat", "/sdcard/window_dump.xml"], serial, outDir, "ui.xml", summary);

  summary.finishedAt = new Date().toISOString();
  const summaryPath = writeText(outDir, "summary.json", JSON.stringify(summary, null, 2));
  console.log(`Diagnosis written to ${outDir}`);
  console.log(`Summary: ${summaryPath}`);
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
