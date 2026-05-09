#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { resolveSerial, runAdbCommand } from "./common";
import { realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "android-device-automation-app-launcher",
  entry: procedureEntry(import.meta.url),
  description:
    "控制 Android 应用生命周期：启动、终止、安装、卸载、列出已安装包、查询运行状态。",
  owners: { skillIds: ["android-device-automation"] },
  target: "scripts/app_launcher.mjs",
  runtime: "node",
  params: [
    {
      flag: "--launch",
      type: "字符串",
      description: "要启动的应用包名",
      required: false,
    },
    {
      flag: "--activity",
      type: "字符串",
      description: "启动指定 Activity（需配合 --launch）",
      required: false,
    },
    {
      flag: "--terminate",
      type: "字符串",
      description: "强制停止指定应用",
      required: false,
    },
    {
      flag: "--install",
      type: "路径",
      description: "安装 APK 文件",
      required: false,
    },
    {
      flag: "--uninstall",
      type: "字符串",
      description: "卸载指定应用",
      required: false,
    },
    {
      flag: "--list",
      type: "",
      description: "列出所有已安装包",
      required: false,
    },
    {
      flag: "--state",
      type: "字符串",
      description: "查询应用是否在运行",
      required: false,
    },
    {
      flag: "--serial",
      type: "字符串",
      description: "目标设备序列号",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "结构化 JSON 输出（预留）",
      required: false,
    },
  ],

  exampleArgs: { args: ["--launch", "com.example.app"] },
});

export class AppLauncher {
  serial: any;
  constructor(serial: any = null) {
    this.serial = serial;
  }
  launch(packageName: any, activity: any = null): any {
    const command = activity
      ? ["shell", "am", "start", "-n", `${packageName}/${activity}`]
      : [
          "shell",
          "monkey",
          "-p",
          packageName,
          "-c",
          "android.intent.category.LAUNCHER",
          "1",
        ];
    try {
      runAdbCommand(command, this.serial);
      return true;
    } catch (error: any) {
      console.error(`Error launching app: ${error.message}`);
      return false;
    }
  }
  terminate(packageName: any): any {
    try {
      runAdbCommand(["shell", "am", "force-stop", packageName], this.serial);
      return true;
    } catch {
      return false;
    }
  }
  install(apkPath: any): any {
    try {
      runAdbCommand(["install", "-r", apkPath], this.serial);
      return true;
    } catch (error: any) {
      console.error(`Error installing APK: ${error.message}`);
      return false;
    }
  }
  uninstall(packageName: any): any {
    try {
      runAdbCommand(["uninstall", packageName], this.serial);
      return true;
    } catch {
      return false;
    }
  }
  listPackages(filter: any = null): any {
    try {
      const command: any[] = ["shell", "pm", "list", "packages"];
      if (filter) command.push(filter);
      const result = runAdbCommand(command, this.serial);
      return parsePackages(result.stdout ?? "");
    } catch {
      return [];
    }
  }
  getAppState(packageName: any): any {
    try {
      const result = runAdbCommand(
        ["shell", "pidof", packageName],
        this.serial,
        { check: false },
      );
      return getAppStateFromPidResult(result);
    } catch {
      return "unknown";
    }
  }
}
export function parsePackages(output: any): any {
  return output
    .split(/\r?\n/)
    .filter((line: any) => line.startsWith("package:"))
    .map((line: any) => line.replace(/^package:/, "").trim())
    .filter(Boolean);
}
export function getAppStateFromPidResult(result: any): any {
  if (result.status === 0 && String(result.stdout ?? "").trim()) {
    return "running";
  }
  return "not running";
}
function usage(): any {
  return `Control Android app lifecycle.

Usage: node scripts/app_launcher.mjs [action] [options]

Actions:
  --launch <package>     Launch app by package name
  --activity <activity>  Specific activity to launch with --launch
  --terminate <package>  Terminate app by package name
  --install <apk>        Install app from APK path
  --uninstall <package>  Uninstall app by package name
  --list                 List installed packages
  --state <package>      Get app state by package name

Options:
  --serial, -s <serial>  Device serial
  --json                 Reserved for future structured output
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    launch: null,
    activity: null,
    terminate: null,
    install: null,
    uninstall: null,
    list: false,
    state: null,
    serial: null,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--list") {
      args.list = true;
      continue;
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (
      [
        "--launch",
        "--activity",
        "--terminate",
        "--install",
        "--uninstall",
        "--state",
        "--serial",
        "-s",
      ].includes(arg)
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--launch") args.launch = value;
      if (arg === "--activity") args.activity = value;
      if (arg === "--terminate") args.terminate = value;
      if (arg === "--install") args.install = value;
      if (arg === "--uninstall") args.uninstall = value;
      if (arg === "--state") args.state = value;
      if (arg === "--serial" || arg === "-s") args.serial = value;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (
    !args.launch &&
    !args.terminate &&
    !args.install &&
    !args.uninstall &&
    !args.list &&
    !args.state
  ) {
    console.log(usage());
    return 0;
  }
  const serial = resolveSerial(args.serial);
  const launcher = new AppLauncher(serial);
  if (args.launch) {
    if (!launcher.launch(args.launch, args.activity)) return 1;
    console.log(`Launched ${args.launch}`);
  } else if (args.terminate) {
    if (!launcher.terminate(args.terminate)) return 1;
    console.log(`Terminated ${args.terminate}`);
  } else if (args.install) {
    if (!launcher.install(args.install)) return 1;
    console.log(`Installed ${args.install}`);
  } else if (args.uninstall) {
    if (!launcher.uninstall(args.uninstall)) return 1;
    console.log(`Uninstalled ${args.uninstall}`);
  } else if (args.list) {
    for (const packageName of launcher.listPackages()) {
      console.log(packageName);
    }
  } else if (args.state) {
    console.log(`${args.state}: ${launcher.getAppState(args.state)}`);
  }
  return 0;
}
