#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { resolveUdid, runCommand } from "./interaction_common.mjs";
import { buildSimctlCommand } from "./simctl_common.mjs";
import { realpathSync } from "node:fs";

export class AppLauncher {
  constructor(udid = null, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
    this.udid = udid;
    this.sleep = sleep;
  }

  launch(bundleId, { waitForDebugger = false } = {}) {
    const command = buildSimctlCommand("launch", this.udid, bundleId);
    if (waitForDebugger) command.splice(3, 0, "--wait-for-debugger");
    const result = runCommand(command);
    if (result.status !== 0) return [false, null];
    return [true, parseLaunchPid(result.stdout ?? "")];
  }

  terminate(bundleId) {
    return runCommand(buildSimctlCommand("terminate", this.udid, bundleId)).status === 0;
  }

  install(appPath) {
    return runCommand(buildSimctlCommand("install", this.udid, appPath)).status === 0;
  }

  uninstall(bundleId) {
    return runCommand(buildSimctlCommand("uninstall", this.udid, bundleId)).status === 0;
  }

  openUrl(url) {
    return runCommand(buildSimctlCommand("openurl", this.udid, url)).status === 0;
  }

  listApps() {
    const result = runCommand(buildSimctlCommand("listapps", this.udid));
    if (result.status !== 0) return [];
    const converted = runCommand(["plutil", "-convert", "json", "-o", "-", "-"], { input: result.stdout ?? "" });
    if (converted.status !== 0) return [];
    try {
      return parseListAppsJson(JSON.parse(converted.stdout));
    } catch {
      return [];
    }
  }

  getAppState(bundleId) {
    const result = runCommand(buildSimctlCommand("spawn", this.udid, "launchctl", "list"));
    if (result.status !== 0) return "unknown";
    return (result.stdout ?? "").includes(bundleId) ? "running" : "not running";
  }

  async restartApp(bundleId, delay = 1.0) {
    this.terminate(bundleId);
    await this.sleep(delay * 1000);
    const [success] = this.launch(bundleId);
    return success;
  }
}

export function parseLaunchPid(output) {
  const parts = output.trim().split(":");
  if (parts.length <= 1) return null;
  const pid = Number.parseInt(parts[1].trim(), 10);
  return Number.isInteger(pid) ? pid : null;
}

export function parseListAppsJson(data) {
  const apps = [];
  for (const [bundleId, appInfo] of Object.entries(data ?? {})) {
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

function usage() {
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
  --wait-for-debugger        Wait for debugger when launching
  --udid <udid>              Device UDID
  --help                     Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    launch: null,
    terminate: null,
    restart: null,
    install: null,
    uninstall: null,
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
    else if (["--launch", "--terminate", "--restart", "--install", "--uninstall", "--open-url", "--state", "--udid"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
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

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const hasAction = args.launch || args.terminate || args.restart || args.install || args.uninstall || args.openUrl || args.list || args.state;
  if (!hasAction) {
    console.log(usage());
    return 1;
  }

  const launcher = new AppLauncher(resolveUdid(args.udid));
  if (args.launch) {
    const [success, pid] = launcher.launch(args.launch, { waitForDebugger: args.waitForDebugger });
    if (!success) {
      console.log(`Failed to launch ${args.launch}`);
      return 1;
    }
    console.log(pid ? `Launched ${args.launch} (PID: ${pid})` : `Launched ${args.launch}`);
  } else if (args.terminate) {
    if (!launcher.terminate(args.terminate)) {
      console.log(`Failed to terminate ${args.terminate}`);
      return 1;
    }
    console.log(`Terminated ${args.terminate}`);
  } else if (args.restart) {
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
      for (const app of apps.slice(0, 10)) console.log(`  ${app.bundle_id}: ${app.name} (v${app.version})`);
      if (apps.length > 10) console.log(`  ... and ${apps.length - 10} more`);
    }
  } else if (args.state) {
    console.log(`${args.state}: ${launcher.getAppState(args.state)}`);
  }
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
