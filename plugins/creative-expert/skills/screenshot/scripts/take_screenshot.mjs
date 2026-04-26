#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { homedir, platform as osPlatform, tmpdir } from "node:os";
import { basename, dirname, extname, join, parse, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const MAC_PERM_SCRIPT = join(SCRIPT_DIR, "macos_permissions.swift");
const MAC_PERM_HELPER = join(SCRIPT_DIR, "ensure_macos_permissions.mjs");
const MAC_WINDOW_SCRIPT = join(SCRIPT_DIR, "macos_window_info.swift");
const MAC_DISPLAY_SCRIPT = join(SCRIPT_DIR, "macos_display_info.swift");
const WINDOWS_HELPER = join(SCRIPT_DIR, "take_screenshot_windows.mjs");
const TEST_MODE_ENV = "CODEX_SCREENSHOT_TEST_MODE";
const TEST_PLATFORM_ENV = "CODEX_SCREENSHOT_TEST_PLATFORM";
const TEST_WINDOWS_ENV = "CODEX_SCREENSHOT_TEST_WINDOWS";
const TEST_DISPLAYS_ENV = "CODEX_SCREENSHOT_TEST_DISPLAYS";
const TEST_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000c4944415408d763f8ffff3f0005fe02fe41ad1c1c0000000049454e44ae426082",
  "hex",
);

export function parseRegion(value) {
  const parts = String(value).split(",").map((part) => part.trim());
  if (parts.length !== 4) {
    throw new Error("region must be x,y,w,h");
  }
  const values = parts.map((part) => Number.parseInt(part, 10));
  if (values.some((valuePart) => !Number.isInteger(valuePart))) {
    throw new Error("region values must be integers");
  }
  const [, , width, height] = values;
  if (width <= 0 || height <= 0) {
    throw new Error("region width and height must be positive");
  }
  return values;
}

export function testModeEnabled(env = process.env) {
  return new Set(["1", "true", "yes", "on"]).has(String(env[TEST_MODE_ENV] ?? "").toLowerCase());
}

export function normalizePlatform(value) {
  const lowered = String(value).trim().toLowerCase();
  if (["darwin", "mac", "macos", "osx"].includes(lowered)) return "Darwin";
  if (["linux", "ubuntu"].includes(lowered)) return "Linux";
  if (["windows", "win"].includes(lowered)) return "Windows";
  return value;
}

function hostPlatform() {
  if (osPlatform() === "darwin") return "Darwin";
  if (osPlatform() === "win32") return "Windows";
  if (osPlatform() === "linux") return "Linux";
  return osPlatform();
}

export function testPlatformOverride(env = process.env) {
  const value = env[TEST_PLATFORM_ENV];
  return value ? normalizePlatform(value) : null;
}

export function parseIntList(value) {
  const results = [];
  for (const part of String(value).split(",")) {
    const parsed = Number.parseInt(part.trim(), 10);
    if (Number.isInteger(parsed)) {
      results.push(parsed);
    }
  }
  return results;
}

export function testWindowIds(env = process.env) {
  const ids = parseIntList(env[TEST_WINDOWS_ENV] ?? "101,102");
  return ids.length ? ids : [101];
}

export function testDisplayIds(env = process.env) {
  const ids = parseIntList(env[TEST_DISPLAYS_ENV] ?? "1,2");
  return ids.length ? ids : [1];
}

export function writeTestPng(path) {
  ensureParent(path);
  writeFileSync(path, TEST_PNG);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export function timestamp(now = new Date()) {
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-") + "_" + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("-");
}

export function defaultFilename(format, prefix = "screenshot") {
  return `${prefix}-${timestamp()}.${format}`;
}

function runCapture(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: options.encoding ?? "utf-8",
  });
}

export function macDefaultDir() {
  const desktop = join(homedir(), "Desktop");
  const proc = runCapture("defaults", ["read", "com.apple.screencapture", "location"]);
  const location = proc.status === 0 ? proc.stdout.trim() : "";
  return location ? expandUser(location) : desktop;
}

export function defaultDir(system) {
  const home = homedir();
  if (system === "Darwin") {
    return macDefaultDir();
  }
  const pictures = join(home, "Pictures");
  const screenshots = join(pictures, "Screenshots");
  if (existsSync(screenshots)) return screenshots;
  if (existsSync(pictures)) return pictures;
  return home;
}

export function ensureParent(path) {
  try {
    mkdirSync(dirname(path), { recursive: true });
  } catch {
    // Let the capture command report a clearer error.
  }
}

function expandUser(path) {
  if (path === "~") return homedir();
  if (path.startsWith("~/") || path.startsWith("~\\")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}

export function resolveOutputPath(requestedPath, mode, format, system) {
  if (requestedPath) {
    let path = expandUser(requestedPath);
    let existingDirectory = false;
    if (existsSync(path)) {
      try {
        existingDirectory = statSync(path).isDirectory();
      } catch {
        existingDirectory = false;
      }
    }
    if (existingDirectory) {
      path = join(path, defaultFilename(format));
    } else if (requestedPath.endsWith("/") || requestedPath.endsWith("\\")) {
      mkdirSync(path, { recursive: true });
      path = join(path, defaultFilename(format));
    } else if (!extname(basename(path))) {
      path = `${path}.${format}`;
    }
    ensureParent(path);
    return path;
  }

  if (mode === "temp") {
    const path = join(tmpdir(), defaultFilename(format, "codex-shot"));
    ensureParent(path);
    return path;
  }

  const path = join(defaultDir(system), defaultFilename(format));
  ensureParent(path);
  return path;
}

export function multiOutputPaths(base, suffixes) {
  if (suffixes.length <= 1) {
    return [base];
  }
  const parsed = parse(base);
  return suffixes.map((suffix) => {
    const candidate = join(parsed.dir, `${parsed.name}-${suffix}${parsed.ext}`);
    ensureParent(candidate);
    return candidate;
  });
}

export function runCommand(cmd) {
  const proc = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
  if (proc.error?.code === "ENOENT") {
    throw new Error(`required command not found: ${cmd[0]}`);
  }
  if (proc.status !== 0) {
    throw new Error(`command failed (${proc.status ?? 1}): ${cmd.join(" ")}`);
  }
}

export function swiftJson(script, extraArgs = []) {
  const moduleCache = join(tmpdir(), "codex-swift-module-cache");
  mkdirSync(moduleCache, { recursive: true });
  const cmd = ["-module-cache-path", moduleCache, script, ...extraArgs];
  const proc = runCapture("swift", cmd);
  if (proc.error?.code === "ENOENT") {
    throw new Error("swift not found; install Xcode command line tools");
  }
  if (proc.status !== 0) {
    const stderr = (proc.stderr ?? "").trim();
    if (stderr.includes("ModuleCache") && stderr.includes("Operation not permitted")) {
      throw new Error("swift needs module-cache access; rerun with escalated permissions");
    }
    throw new Error(stderr || (proc.stdout ?? "").trim() || "swift helper failed");
  }
  try {
    return JSON.parse(proc.stdout);
  } catch {
    throw new Error(`swift helper returned invalid JSON: ${proc.stdout.trim()}`);
  }
}

export function macosScreenCaptureGranted(request = false) {
  const payload = swiftJson(MAC_PERM_SCRIPT, request ? ["--request"] : []);
  return Boolean(payload.screenCapture);
}

export function ensureMacosPermissions() {
  if (process.env.CODEX_SANDBOX) {
    throw new Error("screen capture checks are blocked in the sandbox; rerun with escalated permissions");
  }
  if (macosScreenCaptureGranted()) {
    return;
  }
  spawnSync("node", [MAC_PERM_HELPER], { stdio: "inherit" });
  if (!macosScreenCaptureGranted()) {
    throw new Error("Screen Recording permission is required; enable it in System Settings and retry");
  }
}

export function activateApp(app) {
  const safeApp = app.replaceAll('"', '\\"');
  spawnSync("osascript", ["-e", `tell application "${safeApp}" to activate`], {
    encoding: "utf-8",
  });
}

export function macosWindowPayload(args, frontmost, includeList) {
  const flags = [];
  if (frontmost) flags.push("--frontmost");
  if (args.app) flags.push("--app", args.app);
  if (args.windowName) flags.push("--window-name", args.windowName);
  if (includeList) flags.push("--list");
  return swiftJson(MAC_WINDOW_SCRIPT, flags);
}

export function macosDisplayIndexes() {
  const payload = swiftJson(MAC_DISPLAY_SCRIPT);
  const displays = payload.displays ?? [];
  const indexes = displays
    .map((item) => Number.parseInt(String(item), 10))
    .filter((item) => Number.isInteger(item) && item > 0);
  return indexes.length ? indexes : [1];
}

export function macosWindowIds(args, captureAll) {
  const payload = macosWindowPayload(args, args.activeWindow, captureAll);
  if (captureAll) {
    const ids = (payload.windows ?? [])
      .map((item) => Number.parseInt(String(item.id), 10))
      .filter(Number.isInteger);
    if (ids.length) {
      return ids;
    }
  }
  const selected = payload.selected ?? {};
  const winId = Number.parseInt(String(selected.id), 10);
  if (Number.isInteger(winId)) {
    return [winId];
  }
  throw new Error("no matching macOS window found; try --list-windows to inspect ids");
}

export function listMacosWindows(args) {
  const payload = macosWindowPayload(args, args.activeWindow, true);
  const windows = payload.windows ?? [];
  if (!windows.length) {
    console.log("no matching windows found");
    return;
  }
  for (const item of windows) {
    const bounds = item.bounds ?? {};
    const name = item.name ?? "";
    const width = bounds.width ?? 0;
    const height = bounds.height ?? 0;
    const x = bounds.x ?? 0;
    const y = bounds.y ?? 0;
    console.log(`${item.id}\t${item.owner}\t${name}\t${width}x${height}+${x}+${y}`);
  }
}

export function listTestMacosWindows(args) {
  const owner = args.app || "TestApp";
  const name = args.windowName || "";
  let ids = testWindowIds();
  if (args.activeWindow && ids.length) {
    ids = [ids[0]];
  }
  ids.forEach((winId, index) => {
    const windowName = name || `Window ${index + 1}`;
    console.log(`${winId}\t${owner}\t${windowName}\t800x600+0+0`);
  });
}

export function resolveMacosWindows(args) {
  if (args.app) {
    activateApp(args.app);
  }
  return macosWindowIds(args, !args.activeWindow);
}

export function resolveTestMacosWindows(args) {
  const ids = testWindowIds();
  if (args.activeWindow && ids.length) {
    return [ids[0]];
  }
  return ids;
}

export function captureMacos(args, output, options = {}) {
  const cmd = ["screencapture", "-x", `-t${args.format}`];
  if (args.interactive) cmd.push("-i");
  if (options.display != null) cmd.push(`-D${options.display}`);
  const effectiveWindowId = options.windowId ?? args.windowId;
  if (effectiveWindowId != null) {
    cmd.push(`-l${effectiveWindowId}`);
  } else if (args.region) {
    const [x, y, width, height] = args.region;
    cmd.push(`-R${x},${y},${width},${height}`);
  }
  cmd.push(output);
  runCommand(cmd);
}

function which(command) {
  const paths = (process.env.PATH ?? "").split(process.platform === "win32" ? ";" : ":").filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
    : [""];
  for (const dir of paths) {
    for (const ext of extensions) {
      const candidate = resolve(dir, process.platform === "win32" ? `${command}${ext}` : command);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

export function captureLinux(args, output) {
  const scrot = which("scrot");
  const gnome = which("gnome-screenshot");
  const imagemagick = which("import");
  const xdotool = which("xdotool");

  if (args.region) {
    const [x, y, width, height] = args.region;
    if (scrot) {
      runCommand(["scrot", "-a", `${x},${y},${width},${height}`, output]);
      return;
    }
    if (imagemagick) {
      runCommand(["import", "-window", "root", "-crop", `${width}x${height}+${x}+${y}`, output]);
      return;
    }
    throw new Error("region capture requires scrot or ImageMagick (import)");
  }

  if (args.windowId != null) {
    if (imagemagick) {
      runCommand(["import", "-window", String(args.windowId), output]);
      return;
    }
    throw new Error("window-id capture requires ImageMagick (import)");
  }

  if (args.activeWindow) {
    if (scrot) {
      runCommand(["scrot", "-u", output]);
      return;
    }
    if (gnome) {
      runCommand(["gnome-screenshot", "-w", "-f", output]);
      return;
    }
    if (imagemagick && xdotool) {
      const proc = runCapture("xdotool", ["getactivewindow"]);
      if (proc.status !== 0) {
        throw new Error((proc.stderr || proc.stdout || "xdotool getactivewindow failed").trim());
      }
      runCommand(["import", "-window", proc.stdout.trim(), output]);
      return;
    }
    throw new Error("active-window capture requires scrot, gnome-screenshot, or import+xdotool");
  }

  if (scrot) {
    runCommand(["scrot", output]);
    return;
  }
  if (gnome) {
    runCommand(["gnome-screenshot", "-f", output]);
    return;
  }
  if (imagemagick) {
    runCommand(["import", "-window", "root", output]);
    return;
  }
  throw new Error("no supported screenshot tool found (scrot, gnome-screenshot, or import)");
}

export function captureWindows(args, output) {
  const cmd = ["node", WINDOWS_HELPER, "--path", output, "--format", args.format];
  if (args.region) {
    cmd.push("--region", args.region.join(","));
  }
  if (args.activeWindow) {
    cmd.push("--active-window");
  }
  if (args.windowId != null) {
    cmd.push("--window-handle", String(args.windowId));
  }
  const proc = runCapture(cmd[0], cmd.slice(1));
  if (proc.error?.code === "ENOENT") {
    throw new Error("node not found; install Node.js to capture screenshots on Windows");
  }
  if (proc.status !== 0) {
    throw new Error((proc.stderr || proc.stdout || "Windows screenshot capture failed").trim());
  }
}

function usage() {
  return `Cross-platform screenshot helper for Codex skills.

Usage: node scripts/take_screenshot.mjs [options]

Options:
  --path <path>             output file path or directory; overrides --mode
  --mode <default|temp>     default saves to the OS screenshot location; temp saves to the temp dir
  --format <format>         image format/extension (default: png)
  --app <name>              macOS only: capture matching on-screen windows for this app
  --window-name <name>      macOS only: substring match for a window title
  --list-windows            macOS only: list matching window ids instead of capturing
  --region <x,y,w,h>        capture region in pixel coordinates
  --window-id <id>          capture a specific window id when supported
  --active-window           capture the focused/active window when supported
  --interactive             use interactive selection where the OS tool supports it
  --help                    show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    path: null,
    mode: "default",
    format: "png",
    app: null,
    windowName: null,
    listWindows: false,
    region: null,
    windowId: null,
    activeWindow: false,
    interactive: false,
    help: false,
  };
  const valueOptions = new Set(["--path", "--mode", "--format", "--app", "--window-name", "--region", "--window-id"]);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--list-windows") {
      args.listWindows = true;
      continue;
    }
    if (arg === "--active-window") {
      args.activeWindow = true;
      continue;
    }
    if (arg === "--interactive") {
      args.interactive = true;
      continue;
    }
    if (!valueOptions.has(arg)) {
      throw new Error(`unrecognized argument: ${arg}`);
    }
    const value = argv[index + 1];
    if (value == null || value.startsWith("--")) {
      throw new Error(`${arg} requires a value`);
    }
    index += 1;
    if (arg === "--path") args.path = value;
    if (arg === "--mode") args.mode = value;
    if (arg === "--format") args.format = value;
    if (arg === "--app") args.app = value;
    if (arg === "--window-name") args.windowName = value;
    if (arg === "--region") args.region = parseRegion(value);
    if (arg === "--window-id") {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed)) throw new Error("window-id must be an integer");
      args.windowId = parsed;
    }
  }
  if (!["default", "temp"].includes(args.mode)) {
    throw new Error("--mode must be one of: default, temp");
  }
  return args;
}

function validateArgs(args) {
  if (args.region && args.windowId != null) throw new Error("choose either --region or --window-id, not both");
  if (args.region && args.activeWindow) throw new Error("choose either --region or --active-window, not both");
  if (args.windowId != null && args.activeWindow) throw new Error("choose either --window-id or --active-window, not both");
  if (args.app && args.windowId != null) throw new Error("choose either --app or --window-id, not both");
  if (args.region && args.app) throw new Error("choose either --region or --app, not both");
  if (args.region && args.windowName) throw new Error("choose either --region or --window-name, not both");
  if (args.interactive && args.app) throw new Error("choose either --interactive or --app, not both");
  if (args.interactive && args.windowName) throw new Error("choose either --interactive or --window-name, not both");
  if (args.interactive && args.windowId != null) throw new Error("choose either --interactive or --window-id, not both");
  if (args.interactive && args.activeWindow) throw new Error("choose either --interactive or --active-window, not both");
  if (args.listWindows && (args.region || args.windowId != null || args.interactive)) {
    throw new Error("--list-windows only supports --app, --window-name, and --active-window");
  }
}

function printPaths(paths) {
  for (const path of paths) {
    console.log(path);
  }
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  validateArgs(args);

  const testMode = testModeEnabled();
  let system = hostPlatform();
  if (testMode) {
    system = testPlatformOverride() ?? system;
  }

  let windowIds = [];
  let displayIds = [];

  if (system !== "Darwin" && (args.app || args.windowName || args.listWindows)) {
    throw new Error("--app/--window-name/--list-windows are supported on macOS only");
  }

  if (system === "Darwin") {
    if (testMode) {
      if (args.listWindows) {
        listTestMacosWindows(args);
        return 0;
      }
      if (args.windowId != null) {
        windowIds = [args.windowId];
      } else if (args.app || args.windowName || args.activeWindow) {
        windowIds = resolveTestMacosWindows(args);
      } else if (!args.region && !args.interactive) {
        displayIds = testDisplayIds();
      }
    } else {
      ensureMacosPermissions();
      if (args.listWindows) {
        listMacosWindows(args);
        return 0;
      }
      if (args.windowId != null) {
        windowIds = [args.windowId];
      } else if (args.app || args.windowName || args.activeWindow) {
        windowIds = resolveMacosWindows(args);
      } else if (!args.region && !args.interactive) {
        displayIds = macosDisplayIndexes();
      }
    }
  }

  const output = resolveOutputPath(args.path, args.mode, args.format, system);

  if (testMode) {
    if (system === "Darwin") {
      if (windowIds.length) {
        const paths = multiOutputPaths(output, windowIds.map((winId) => `w${winId}`));
        for (const path of paths) writeTestPng(path);
        printPaths(paths);
        return 0;
      }
      if (displayIds.length > 1) {
        const paths = multiOutputPaths(output, displayIds.map((displayId) => `d${displayId}`));
        for (const path of paths) writeTestPng(path);
        printPaths(paths);
        return 0;
      }
    }
    writeTestPng(output);
    console.log(output);
    return 0;
  }

  if (system === "Darwin") {
    if (windowIds.length) {
      const paths = multiOutputPaths(output, windowIds.map((winId) => `w${winId}`));
      windowIds.forEach((winId, index) => captureMacos(args, paths[index], { windowId: winId }));
      printPaths(paths);
      return 0;
    }
    if (displayIds.length > 1) {
      const paths = multiOutputPaths(output, displayIds.map((displayId) => `d${displayId}`));
      displayIds.forEach((displayId, index) => captureMacos(args, paths[index], { display: displayId }));
      printPaths(paths);
      return 0;
    }
    captureMacos(args, output);
  } else if (system === "Linux") {
    captureLinux(args, output);
  } else if (system === "Windows") {
    captureWindows(args, output);
  } else {
    throw new Error(`unsupported platform: ${system}`);
  }

  console.log(output);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
