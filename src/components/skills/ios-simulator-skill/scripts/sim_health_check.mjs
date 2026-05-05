#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const BLUE = "\x1b[0;34m";
const NC = "\x1b[0m";

let checksPassed = 0;
let checksFailed = 0;

function showHelp() {
  console.log(`iOS Simulator Testing - Environment Health Check

Verifies that your environment is properly configured for iOS simulator testing.

Usage: node scripts/sim_health_check.mjs [options]

Options:
  --help, -h    Show this help message

This script checks for:
  - Xcode Command Line Tools installation
  - iOS Simulator availability
  - IDB (iOS Development Bridge) installation
  - Available simulator devices
  - Node.js runtime support

Exit codes:
  0 - All checks passed
  1 - One or more checks failed (see output for details)`);
}

if (process.argv.slice(2).some((arg) => ["--help", "-h"].includes(arg))) {
  showHelp();
  process.exit(0);
}

function executableNames(command) {
  if (process.platform !== "win32" || path.extname(command)) {
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

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8" });
}

function firstOutputLine(result) {
  return `${result.stdout || ""}${result.stderr || ""}`.split(/\r?\n/).find((line) => line.trim()) || "Unknown";
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

console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
console.log(`${BLUE}  iOS Simulator Testing - Environment Health Check${NC}`);
console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
console.log("");

console.log(`${BLUE}[1/8]${NC} Checking operating system...`);
if (process.platform === "darwin") {
  const swVers = findExecutable("sw_vers");
  const version = swVers ? firstOutputLine(run(swVers, ["-productVersion"])) : "unknown";
  checkPassed(`macOS detected (version ${version})`);
} else {
  checkFailed(`Not running on macOS (detected: ${process.platform})`);
  console.log("       iOS Simulator testing requires macOS");
}
console.log("");

console.log(`${BLUE}[2/8]${NC} Checking Xcode Command Line Tools...`);
const xcrunPath = findExecutable("xcrun");
if (xcrunPath) {
  const xcodeSelect = findExecutable("xcode-select");
  const xcodePath = xcodeSelect ? firstOutputLine(run(xcodeSelect, ["-p"])) : "not found";
  if (xcodePath !== "not found") {
    const xcodebuild = findExecutable("xcodebuild");
    const xcodeVersion = xcodebuild ? firstOutputLine(run(xcodebuild, ["-version"])) : "Unknown";
    checkPassed("Xcode Command Line Tools installed");
    console.log(`       Path: ${xcodePath}`);
    console.log(`       Version: ${xcodeVersion}`);
  } else {
    checkFailed("Xcode Command Line Tools path not set");
    console.log("       Run: xcode-select --install");
  }
} else {
  checkFailed("xcrun command not found");
  console.log("       Install Xcode Command Line Tools: xcode-select --install");
}
console.log("");

console.log(`${BLUE}[3/8]${NC} Checking simctl (Simulator Control)...`);
if (xcrunPath && run(xcrunPath, ["simctl", "help"]).status === 0) {
  checkPassed("simctl is available");
} else {
  checkFailed("simctl not available");
  console.log("       simctl comes with Xcode Command Line Tools");
}
console.log("");

console.log(`${BLUE}[4/8]${NC} Checking IDB (iOS Development Bridge)...`);
const idbPath = findExecutable("idb");
if (idbPath) {
  checkPassed("IDB is installed");
  console.log(`       Path: ${idbPath}`);
  console.log(`       Version: ${firstOutputLine(run(idbPath, ["--version"]))}`);
} else {
  checkWarning("IDB not found in PATH");
  console.log("       IDB is optional but provides advanced UI automation");
  console.log("       Install: https://fbidb.io/docs/installation");
  console.log("       Recommended: brew tap facebook/fb && brew install idb-companion");
}
console.log("");

console.log(`${BLUE}[5/8]${NC} Checking Node.js runtime...`);
checkPassed(`Node.js is available (version ${process.versions.node})`);
console.log("");

function simulatorLines(args) {
  if (!xcrunPath) {
    return [];
  }
  const result = run(xcrunPath, args);
  return (result.stdout || "").split(/\r?\n/).filter((line) => /iPhone|iPad/.test(line));
}

console.log(`${BLUE}[6/8]${NC} Checking available iOS Simulators...`);
if (xcrunPath) {
  const simulators = simulatorLines(["simctl", "list", "devices", "available"]);
  if (simulators.length > 0) {
    checkPassed(`Found ${simulators.length} available simulator(s)`);
    console.log("");
    console.log("       Available simulators (showing up to 5):");
    for (const line of simulators.slice(0, 5)) {
      console.log(`       - ${line.trim()}`);
    }
  } else {
    checkWarning("No simulators found");
    console.log("       Create simulators via Xcode or simctl");
    console.log("       Example: xcrun simctl create 'iPhone 15' 'iPhone 15'");
  }
} else {
  checkFailed("Cannot check simulators (simctl not available)");
}
console.log("");

console.log(`${BLUE}[7/8]${NC} Checking booted simulators...`);
if (xcrunPath) {
  const booted = simulatorLines(["simctl", "list", "devices", "booted"]);
  if (booted.length > 0) {
    checkPassed(`${booted.length} simulator(s) currently booted`);
    console.log("");
    console.log("       Booted simulators:");
    for (const line of booted) {
      console.log(`       - ${line.trim()}`);
    }
  } else {
    checkWarning("No simulators currently booted");
    console.log("       Boot a simulator to begin testing");
    console.log("       Example: xcrun simctl boot <device-udid>");
    console.log("       Or: open -a Simulator");
  }
} else {
  checkFailed("Cannot check booted simulators (simctl not available)");
}
console.log("");

console.log(`${BLUE}[8/8]${NC} Checking visual diff support...`);
checkPassed("Visual diff uses built-in Node.js PNG support");
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
console.log(`${GREEN}✓ Environment is ready for iOS simulator testing${NC}`);
console.log("");
console.log("Next steps:");
console.log("  1. Boot a simulator: open -a Simulator");
console.log("  2. Launch your app: xcrun simctl launch booted <bundle-id>");
console.log("  3. Run accessibility audit: node scripts/accessibility_audit.mjs");
