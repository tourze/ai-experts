#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const BLUE = "\x1b[0;34m";
const NC = "\x1b[0m";

let checksPassed = 0;
let checksFailed = 0;

function showHelp() {
  console.log(`Android Device/Emulator Testing - Environment Health Check

Verifies that your environment is properly configured for Android device or emulator testing.

Usage: node scripts/emu_health_check.mjs [options]

Options:
  --help, -h, -Help    Show this help message

This script checks for:
  - Android SDK availability (ANDROID_HOME)
  - ADB (Android Debug Bridge) installation
  - Emulator executable availability for AVD workflows
  - Java Development Kit (JDK)
  - Connected Android devices/emulators

Exit codes:
  0 - All checks passed
  1 - One or more checks failed (see output for details)`);
}

if (process.argv.slice(2).some((arg) => ["--help", "-h", "-Help"].includes(arg))) {
  showHelp();
  process.exit(0);
}

function executableNames(command) {
  if (process.platform !== "win32") {
    return [command];
  }
  if (path.extname(command)) {
    return [command];
  }
  return (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";").map((ext) => `${command}${ext}`);
}

function isExecutable(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return false;
    }
    if (process.platform === "win32") {
      return true;
    }
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findExecutable(command) {
  for (const dir of (process.env.PATH || "").split(path.delimiter).filter(Boolean)) {
    for (const name of executableNames(command)) {
      const candidate = path.join(dir, name);
      if (isExecutable(candidate)) {
        return candidate;
      }
    }
  }
  return "";
}

function findExecutableInDir(dir, command) {
  for (const name of executableNames(command)) {
    const candidate = path.join(dir, name);
    if (isExecutable(candidate)) {
      return candidate;
    }
  }
  return "";
}

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8" });
}

function firstOutputLine(result) {
  return `${result.stdout || ""}${result.stderr || ""}`.split(/\r?\n/).find((line) => line.trim()) || "unknown";
}

function checkPassed(message) {
  console.log(`${GREEN}✓${NC} ${message}`);
  checksPassed += 1;
}

function checkFailed(message) {
  console.log(`${RED}✗${NC} ${message}`);
  checksFailed += 1;
}

function checkWarning(message) {
  console.log(`${YELLOW}⚠${NC} ${message}`);
}

function standardAndroidSdkCandidates() {
  const home = os.homedir();
  return [
    path.join(home, "Library", "Android", "sdk"),
    path.join(home, "Android", "Sdk"),
    path.join(home, "AppData", "Local", "Android", "Sdk"),
  ];
}

function addToPath(dir) {
  process.env.PATH = `${process.env.PATH || ""}${path.delimiter}${dir}`;
}

console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
console.log(`${BLUE}  Android Device/Emulator Testing - Environment Health Check${NC}`);
console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
console.log("");

console.log(`${BLUE}[1/5]${NC} Checking ANDROID_HOME...`);
let androidHome = process.env.ANDROID_HOME || "";
if (androidHome) {
  checkPassed(`ANDROID_HOME is set to ${androidHome}`);
} else {
  androidHome = standardAndroidSdkCandidates().find((candidate) => {
    try {
      return fs.statSync(candidate).isDirectory();
    } catch {
      return false;
    }
  }) || "";

  if (androidHome) {
    process.env.ANDROID_HOME = androidHome;
    checkWarning(`ANDROID_HOME not set, but found valid SDK at ${androidHome}`);
    console.log("       Exporting for this session.");
  } else {
    checkFailed("ANDROID_HOME environment variable not set");
    console.log("       Please set ANDROID_HOME to your Android SDK location.");
  }
}
console.log("");

console.log(`${BLUE}[2/5]${NC} Checking ADB (Android Debug Bridge)...`);
let adbPath = findExecutable("adb");
if (adbPath) {
  const adbVersion = firstOutputLine(run(adbPath, ["--version"]));
  checkPassed(`ADB is installed (${adbVersion})`);
  console.log(`       Path: ${adbPath}`);
} else if (androidHome) {
  adbPath = findExecutableInDir(path.join(androidHome, "platform-tools"), "adb");
  if (adbPath) {
    addToPath(path.dirname(adbPath));
    checkWarning("ADB found in SDK but not in PATH. Adding it temporarily.");
    checkPassed("ADB is installed");
  } else {
    checkFailed("ADB command not found");
    console.log("       Ensure platform-tools is in your PATH.");
  }
} else {
  checkFailed("ADB command not found");
  console.log("       Ensure platform-tools is in your PATH.");
}
console.log("");

console.log(`${BLUE}[3/5]${NC} Checking Android Emulator...`);
let emulatorPath = findExecutable("emulator");
if (emulatorPath) {
  const emulatorVersion = firstOutputLine(run(emulatorPath, ["-version"]));
  checkPassed(`Emulator is installed (${emulatorVersion})`);
} else if (androidHome) {
  emulatorPath = findExecutableInDir(path.join(androidHome, "emulator"), "emulator");
  if (emulatorPath) {
    addToPath(path.dirname(emulatorPath));
    checkWarning("Emulator found in SDK but not in PATH. Adding it temporarily.");
    checkPassed("Emulator is installed");
  } else {
    checkWarning("Emulator command not found");
    console.log("       Required only when booting or managing AVDs.");
  }
} else {
  checkWarning("Emulator command not found");
  console.log("       Required only when booting or managing AVDs.");
}
console.log("");

console.log(`${BLUE}[4/5]${NC} Checking Java...`);
const javaPath = findExecutable("java");
if (javaPath) {
  checkPassed(`Java is installed (${firstOutputLine(run(javaPath, ["-version"]))})`);
} else {
  checkFailed("Java not found");
  console.log("       A JDK is required for Android development.");
}
console.log("");

console.log(`${BLUE}[5/5]${NC} Checking connected devices...`);
adbPath = findExecutable("adb");
if (adbPath) {
  const adbDevices = run(adbPath, ["devices"]).stdout || "";
  const devices = adbDevices.split(/\r?\n/).filter((line) => /\bdevice$/.test(line.trim()));
  if (devices.length > 0) {
    checkPassed(`Found ${devices.length} connected device(s)`);
    console.log("");
    console.log("       Connected devices:");
    for (const device of devices) {
      console.log(`       - ${device}`);
    }
  } else {
    checkWarning("No devices connected or emulators booted");
    console.log("       Connect a device or boot an emulator to begin testing.");
    console.log("       Use 'emulator -list-avds' to see available AVDs.");
  }
} else {
  checkFailed("Cannot check devices (adb not found)");
}
console.log("");

console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
console.log(`${BLUE}  Summary${NC}`);
console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
console.log("");
console.log(`Checks passed: ${GREEN}${checksPassed}${NC}`);
if (checksFailed > 0) {
  console.log(`Checks failed: ${RED}${checksFailed}${NC}`);
  console.log("");
  console.log(`${YELLOW}Action required:${NC} Fix the failed checks above before testing`);
  process.exit(1);
}

console.log("");
console.log(`${GREEN}✓ Environment is ready for Android device/emulator testing${NC}`);
