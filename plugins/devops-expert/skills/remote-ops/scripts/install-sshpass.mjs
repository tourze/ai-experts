#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { delimiter, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MANUAL_COMMANDS = {
  darwin: "brew install hudochenkov/sshpass/sshpass",
  apt: "sudo apt-get install sshpass",
  dnf: "sudo dnf install sshpass",
  yum: "sudo yum install sshpass",
  pacman: "sudo pacman -S sshpass",
};

export function commandExists(command, env = process.env) {
  const paths = (env.PATH ?? "").split(delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
    : [""];

  for (const dir of paths) {
    for (const ext of extensions) {
      if (existsSync(resolve(dir, process.platform === "win32" ? `${command}${ext}` : command))) {
        return true;
      }
    }
  }
  return false;
}

function withSudo(command, args, options) {
  if (options.isRoot) {
    return { command, args, manualCommand: `${command} ${args.join(" ")}` };
  }
  if (!options.hasCommand("sudo")) {
    return { error: "sudo_missing", manualCommand: `sudo ${command} ${args.join(" ")}` };
  }
  return {
    command: "sudo",
    args: [command, ...args],
    manualCommand: `sudo ${command} ${args.join(" ")}`,
  };
}

export function resolveInstallPlan({
  platform = process.platform,
  hasCommand = commandExists,
  isRoot = typeof process.getuid === "function" && process.getuid() === 0,
} = {}) {
  if (hasCommand("sshpass")) {
    return { alreadyInstalled: true };
  }

  if (platform === "darwin") {
    if (!hasCommand("brew")) {
      return { error: "brew_missing", manualCommand: MANUAL_COMMANDS.darwin };
    }
    return {
      command: "brew",
      args: ["install", "hudochenkov/sshpass/sshpass"],
      manualCommand: MANUAL_COMMANDS.darwin,
    };
  }

  if (platform === "linux") {
    if (hasCommand("apt-get")) {
      return withSudo("apt-get", ["install", "sshpass"], { hasCommand, isRoot });
    }
    if (hasCommand("dnf")) {
      return withSudo("dnf", ["install", "sshpass"], { hasCommand, isRoot });
    }
    if (hasCommand("yum")) {
      return withSudo("yum", ["install", "sshpass"], { hasCommand, isRoot });
    }
    if (hasCommand("pacman")) {
      return withSudo("pacman", ["-S", "sshpass"], { hasCommand, isRoot });
    }
  }

  return {
    error: "unsupported_platform",
    manualCommand: [
      MANUAL_COMMANDS.darwin,
      MANUAL_COMMANDS.apt,
      MANUAL_COMMANDS.dnf,
      MANUAL_COMMANDS.yum,
      MANUAL_COMMANDS.pacman,
    ].join("\n"),
  };
}

export function main() {
  const plan = resolveInstallPlan();
  if (plan.alreadyInstalled) {
    console.log("sshpass is already installed.");
    return 0;
  }
  if (!plan.command) {
    console.error("Cannot install sshpass automatically. Run one of:");
    console.error(plan.manualCommand);
    return 1;
  }

  console.log(`Running: ${plan.command} ${plan.args.join(" ")}`);
  const result = spawnSync(plan.command, plan.args, { stdio: "inherit" });
  return result.status ?? 1;
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  process.exitCode = main();
}
