#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { delimiter, resolve } from "node:path";

export const procedure = defineCliProcedure({
  id: "remote-ssh-command-install-sshpass",
  entry: procedureEntry(import.meta.url),
  description:
    "自动检测并安装 sshpass 工具：根据操作系统和包管理器自动选择安装方式（brew/apt/dnf/yum/pacman），支持 sudo 提权。",
  owners: { skillIds: ["remote-ssh-command"] },
  target: "scripts/install-sshpass.mjs",
  runtime: "node",
  params: [
    {
      flag: "--yes",
      type: "",
      description: "跳过本机安装确认；仅在用户已明确确认会修改本机环境后使用",
      required: false,
    },
  ],

  exampleArgs: { args: [] },
});

const MANUAL_COMMANDS: Record<string, any> = {
  darwin: "brew install hudochenkov/sshpass/sshpass",
  apt: "sudo apt-get install sshpass",
  dnf: "sudo dnf install sshpass",
  yum: "sudo yum install sshpass",
  pacman: "sudo pacman -S sshpass",
};
export function commandExists(command: any, env: any = process.env): any {
  const paths = (env.PATH ?? "").split(delimiter).filter(Boolean);
  const extensions =
    process.platform === "win32"
      ? (env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
      : [""];
  for (const dir of paths) {
    for (const ext of extensions) {
      if (
        existsSync(
          resolve(
            dir,
            process.platform === "win32" ? `${command}${ext}` : command,
          ),
        )
      ) {
        return true;
      }
    }
  }
  return false;
}
function withSudo(command: any, args: any, options: any): any {
  if (options.isRoot) {
    return { command, args, manualCommand: `${command} ${args.join(" ")}` };
  }
  if (!options.hasCommand("sudo")) {
    return {
      error: "sudo_missing",
      manualCommand: `sudo ${command} ${args.join(" ")}`,
    };
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
}: any = {}): any {
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
      return withSudo("apt-get", ["install", "sshpass"], {
        hasCommand,
        isRoot,
      });
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
function usage(): any {
  return `Install sshpass on this machine.

Usage: node scripts/install-sshpass.mjs [options]

Options:
  --yes     Skip local package installation confirmation after explicit user approval
  --help    Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    yes: false,
    help: false,
  };
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--yes") args.yes = true;
    else throw new Error(`unrecognized argument: ${arg}`);
  }
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
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
  if (
    !args.yes &&
    !readConfirmation(
      `Install sshpass locally by running '${plan.manualCommand}'? (type 'yes' to confirm): `,
    )
  ) {
    console.log("sshpass installation cancelled: confirmation required");
    return 1;
  }
  console.log(`Running: ${plan.command} ${plan.args.join(" ")}`);
  const result = spawnSync(plan.command, plan.args, { stdio: "inherit" });
  return result.status ?? 1;
}
export function readConfirmation(prompt: any): any {
  process.stdout.write(prompt);
  try {
    return (
      readFileSync(0, "utf8").trim().split(/\r?\n/)[0]?.toLowerCase() === "yes"
    );
  } catch {
    return false;
  }
}
