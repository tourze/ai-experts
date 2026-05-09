#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { resolveUdid, runCommand } from "./interaction_common";
import { buildSimctlCommand } from "./simctl_common";
import { readFileSync, realpathSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-app-launcher",
  entry: procedureEntry(import.meta.url),
  description:
    "控制 iOS 应用生命周期：启动、终止、重启、安装、卸载、打开 URL、列出已安装应用、查询运行状态。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/app_launcher.mjs",
  runtime: "node",
  params: [
    {
      flag: "--launch",
      type: "字符串",
      description: "要启动的应用 bundle ID",
      required: false,
    },
    {
      flag: "--terminate",
      type: "字符串",
      description: "强制终止指定应用",
      required: false,
    },
    {
      flag: "--restart",
      type: "字符串",
      description: "重新启动指定应用",
      required: false,
    },
    {
      flag: "--install",
      type: "路径",
      description: "安装 .app 包",
      required: false,
    },
    {
      flag: "--uninstall",
      type: "字符串",
      description: "卸载指定应用",
      required: false,
    },
    {
      flag: "--yes",
      type: "",
      description: "跳过终止、重启或卸载确认；仅在用户已明确确认 bundle ID 和目标模拟器后使用",
      required: false,
    },
    {
      flag: "--open-url",
      type: "字符串",
      description: "在模拟器中打开 URL",
      required: false,
    },
    {
      flag: "--list",
      type: "",
      description: "列出所有已安装应用",
      required: false,
    },
    {
      flag: "--state",
      type: "字符串",
      description: "查询应用运行状态",
      required: false,
    },
    {
      flag: "--wait-for-debugger",
      type: "",
      description: "启动时等待调试器附加，传此标志即启用",
      required: false,
    },
    {
      flag: "--udid",
      type: "字符串",
      description: "目标设备 UDID",
      required: false,
    },
  ],

  exampleArgs: { args: ["--launch", "com.example.app"] },
});

export class AppLauncher {
  sleep: any;
  udid: any;
  constructor(
    udid: any = null,
    sleep: any = (ms: any): any =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    this.udid = udid;
    this.sleep = sleep;
  }
  launch(bundleId: any, { waitForDebugger = false }: any = {}): any {
    const command = buildSimctlCommand("launch", this.udid, bundleId);
    if (waitForDebugger) command.splice(3, 0, "--wait-for-debugger");
    const result = runCommand(command);
    if (result.status !== 0) return [false, null];
    return [true, parseLaunchPid(result.stdout ?? "")];
  }
  terminate(bundleId: any): any {
    return (
      runCommand(buildSimctlCommand("terminate", this.udid, bundleId))
        .status === 0
    );
  }
  install(appPath: any): any {
    return (
      runCommand(buildSimctlCommand("install", this.udid, appPath)).status === 0
    );
  }
  uninstall(bundleId: any): any {
    return (
      runCommand(buildSimctlCommand("uninstall", this.udid, bundleId))
        .status === 0
    );
  }
  openUrl(url: any): any {
    return (
      runCommand(buildSimctlCommand("openurl", this.udid, url)).status === 0
    );
  }
  listApps(): any {
    const result = runCommand(buildSimctlCommand("listapps", this.udid));
    if (result.status !== 0) return [];
    const converted = runCommand(
      ["plutil", "-convert", "json", "-o", "-", "-"],
      { input: result.stdout ?? "" },
    );
    if (converted.status !== 0) return [];
    try {
      return parseListAppsJson(JSON.parse(converted.stdout));
    } catch {
      return [];
    }
  }
  getAppState(bundleId: any): any {
    const result = runCommand(
      buildSimctlCommand("spawn", this.udid, "launchctl", "list"),
    );
    if (result.status !== 0) return "unknown";
    return (result.stdout ?? "").includes(bundleId) ? "running" : "not running";
  }
  async restartApp(bundleId: any, delay: any = 1.0): Promise<any> {
    this.terminate(bundleId);
    await this.sleep(delay * 1000);
    const [success] = this.launch(bundleId);
    return success;
  }
}
export function parseLaunchPid(output: any): any {
  const parts = output.trim().split(":");
  if (parts.length <= 1) return null;
  const pid = Number.parseInt(parts[1].trim(), 10);
  return Number.isInteger(pid) ? pid : null;
}
export function parseListAppsJson(data: any): any {
  const apps: any[] = [];
  for (const [bundleId, appInfo] of Object.entries(
    (data ?? {}) as Record<string, any>,
  )) {
    if (appInfo?.ApplicationType === "Hidden") continue;
    apps.push({
      bundle_id: bundleId,
      name: appInfo?.CFBundleDisplayName ?? appInfo?.CFBundleName ?? bundleId,
      path: appInfo?.Path ?? "",
      version: appInfo?.CFBundleVersion ?? "Unknown",
      type: appInfo?.ApplicationType ?? "User",
    });
  }
  return apps;
}
function usage(): any {
  return `Control iOS app lifecycle.

Usage: node scripts/app_launcher.mjs [action] [options]

Actions:
  --launch <bundle-id>       Launch app
  --terminate <bundle-id>    Terminate app
  --restart <bundle-id>      Restart app
  --install <app-path>       Install .app bundle
  --uninstall <bundle-id>    Uninstall app
  --open-url <url>           Open URL
  --list                     List installed apps
  --state <bundle-id>        Get app state

Options:
  --yes                      Skip terminate/restart/uninstall confirmation after explicit user approval
  --wait-for-debugger        Wait for debugger when launching
  --udid <udid>              Device UDID
  --help                     Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    launch: null,
    terminate: null,
    restart: null,
    install: null,
    uninstall: null,
    yes: false,
    openUrl: null,
    list: false,
    state: null,
    waitForDebugger: false,
    udid: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--list") args.list = true;
    else if (arg === "--wait-for-debugger") args.waitForDebugger = true;
    else if (arg === "--yes") args.yes = true;
    else if (
      [
        "--launch",
        "--terminate",
        "--restart",
        "--install",
        "--uninstall",
        "--open-url",
        "--state",
        "--udid",
      ].includes(arg)
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--launch") args.launch = value;
      if (arg === "--terminate") args.terminate = value;
      if (arg === "--restart") args.restart = value;
      if (arg === "--install") args.install = value;
      if (arg === "--uninstall") args.uninstall = value;
      if (arg === "--open-url") args.openUrl = value;
      if (arg === "--state") args.state = value;
      if (arg === "--udid") args.udid = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return args;
}
export async function main(argv: readonly string[]): Promise<any> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const hasAction =
    args.launch ||
    args.terminate ||
    args.restart ||
    args.install ||
    args.uninstall ||
    args.openUrl ||
    args.list ||
    args.state;
  if (!hasAction) {
    console.log(usage());
    return 1;
  }
  const udid = resolveUdid(args.udid);
  const launcher = new AppLauncher(udid);
  if (args.launch) {
    const [success, pid] = launcher.launch(args.launch, {
      waitForDebugger: args.waitForDebugger,
    });
    if (!success) {
      console.log(`Failed to launch ${args.launch}`);
      return 1;
    }
    console.log(
      pid ? `Launched ${args.launch} (PID: ${pid})` : `Launched ${args.launch}`,
    );
  } else if (args.terminate) {
    if (!confirmAppLifecycleChange(args.yes, "Terminate", args.terminate, udid)) {
      console.log("Terminate cancelled: confirmation required");
      return 1;
    }
    if (!launcher.terminate(args.terminate)) {
      console.log(`Failed to terminate ${args.terminate}`);
      return 1;
    }
    console.log(`Terminated ${args.terminate}`);
  } else if (args.restart) {
    if (!confirmAppLifecycleChange(args.yes, "Restart", args.restart, udid)) {
      console.log("Restart cancelled: confirmation required");
      return 1;
    }
    if (!(await launcher.restartApp(args.restart))) {
      console.log(`Failed to restart ${args.restart}`);
      return 1;
    }
    console.log(`Restarted ${args.restart}`);
  } else if (args.install) {
    if (!launcher.install(args.install)) {
      console.log(`Failed to install ${args.install}`);
      return 1;
    }
    console.log(`Installed ${args.install}`);
  } else if (args.uninstall) {
    if (!confirmAppLifecycleChange(args.yes, "Uninstall", args.uninstall, udid)) {
      console.log("Uninstall cancelled: confirmation required");
      return 1;
    }
    if (!launcher.uninstall(args.uninstall)) {
      console.log(`Failed to uninstall ${args.uninstall}`);
      return 1;
    }
    console.log(`Uninstalled ${args.uninstall}`);
  } else if (args.openUrl) {
    if (!launcher.openUrl(args.openUrl)) {
      console.log(`Failed to open URL: ${args.openUrl}`);
      return 1;
    }
    console.log(`Opened URL: ${args.openUrl}`);
  } else if (args.list) {
    const apps = launcher.listApps();
    if (!apps.length) {
      console.log("No apps found or failed to list");
    } else {
      console.log(`Installed apps (${apps.length}):`);
      for (const app of apps.slice(0, 10))
        console.log(`  ${app.bundle_id}: ${app.name} (v${app.version})`);
      if (apps.length > 10) console.log(`  ... and ${apps.length - 10} more`);
    }
  } else if (args.state) {
    console.log(`${args.state}: ${launcher.getAppState(args.state)}`);
  }
  return 0;
}
function confirmAppLifecycleChange(
  yes: any,
  action: any,
  bundleId: any,
  udid: any,
): any {
  if (yes) return true;
  return readConfirmation(
    `${action} ${bundleId} on simulator ${udid}? (type 'yes' to confirm): `,
  );
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
