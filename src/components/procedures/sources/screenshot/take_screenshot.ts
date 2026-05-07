#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync, realpathSync } from "node:fs";
import { homedir, platform as osPlatform, tmpdir } from "node:os";
import { basename, dirname, extname, join, parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runMacosDisplayInfo } from "./macos_display_info";
import { runMacosPermissions } from "./macos_permissions";
import { runMacosWindowInfo } from "./macos_window_info";
import { main as runWindowsScreenshot } from "./take_screenshot_windows";
const TEST_MODE_ENV = "CODEX_SCREENSHOT_TEST_MODE";
const TEST_PLATFORM_ENV = "CODEX_SCREENSHOT_TEST_PLATFORM";
const TEST_WINDOWS_ENV = "CODEX_SCREENSHOT_TEST_WINDOWS";
const TEST_DISPLAYS_ENV = "CODEX_SCREENSHOT_TEST_DISPLAYS";
const TEST_PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000c4944415408d763f8ffff3f0005fe02fe41ad1c1c0000000049454e44ae426082", "hex");
export function parseRegion(value: any): any {
    const parts = String(value).split(",").map((part: any) => part.trim());
    if (parts.length !== 4) {
        throw new Error("region must be x,y,w,h");
    }
    const values = parts.map((part: any) => Number.parseInt(part, 10));
    if (values.some((valuePart: any) => !Number.isInteger(valuePart))) {
        throw new Error("region values must be integers");
    }
    const [, , width, height] = values;
    if (width <= 0 || height <= 0) {
        throw new Error("region width and height must be positive");
    }
    return values;
}
export function testModeEnabled(env: any = process.env): any {
    return new Set(["1", "true", "yes", "on"]).has(String(env[TEST_MODE_ENV] ?? "").toLowerCase());
}
export function normalizePlatform(value: any): any {
    const lowered = String(value).trim().toLowerCase();
    if (["darwin", "mac", "macos", "osx"].includes(lowered))
        return "Darwin";
    if (["linux", "ubuntu"].includes(lowered))
        return "Linux";
    if (["windows", "win"].includes(lowered))
        return "Windows";
    return value;
}
function hostPlatform(): any {
    if (osPlatform() === "darwin")
        return "Darwin";
    if (osPlatform() === "win32")
        return "Windows";
    if (osPlatform() === "linux")
        return "Linux";
    return osPlatform();
}
export function testPlatformOverride(env: any = process.env): any {
    const value = env[TEST_PLATFORM_ENV];
    return value ? normalizePlatform(value) : null;
}
export function parseIntList(value: any): any {
    const results: any[] = [];
    for (const part of String(value).split(",")) {
        const parsed = Number.parseInt(part.trim(), 10);
        if (Number.isInteger(parsed)) {
            results.push(parsed);
        }
    }
    return results;
}
export function testWindowIds(env: any = process.env): any {
    const ids = parseIntList(env[TEST_WINDOWS_ENV] ?? "101,102");
    return ids.length ? ids : [101];
}
export function testDisplayIds(env: any = process.env): any {
    const ids = parseIntList(env[TEST_DISPLAYS_ENV] ?? "1,2");
    return ids.length ? ids : [1];
}
export function writeTestPng(path: any): any {
    ensureParent(path);
    writeFileSync(path, TEST_PNG);
}
function pad(value: any): any {
    return String(value).padStart(2, "0");
}
export function timestamp(now: any = new Date()): any {
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
export function defaultFilename(format: any, prefix: any = "screenshot"): any {
    return `${prefix}-${timestamp()}.${format}`;
}
function runCapture(command: any, args: any, options: any = {}): any {
    return spawnSync(command, args, {
        cwd: options.cwd,
        input: options.input,
        encoding: options.encoding ?? "utf-8",
    });
}
export function macDefaultDir(): any {
    const desktop = join(homedir(), "Desktop");
    const proc = runCapture("defaults", ["read", "com.apple.screencapture", "location"]);
    const location = proc.status === 0 ? proc.stdout.trim() : "";
    return location ? expandUser(location) : desktop;
}
export function defaultDir(system: any): any {
    const home = homedir();
    if (system === "Darwin") {
        return macDefaultDir();
    }
    const pictures = join(home, "Pictures");
    const screenshots = join(pictures, "Screenshots");
    if (existsSync(screenshots))
        return screenshots;
    if (existsSync(pictures))
        return pictures;
    return home;
}
export function ensureParent(path: any): any {
    try {
        mkdirSync(dirname(path), { recursive: true });
    }
    catch {
        // Let the capture command report a clearer error.
    }
}
function expandUser(path: any): any {
    if (path === "~")
        return homedir();
    if (path.startsWith("~/") || path.startsWith("~\\")) {
        return join(homedir(), path.slice(2));
    }
    return path;
}
export function resolveOutputPath(requestedPath: any, mode: any, format: any, system: any): any {
    if (requestedPath) {
        let path = expandUser(requestedPath);
        let existingDirectory = false;
        if (existsSync(path)) {
            try {
                existingDirectory = statSync(path).isDirectory();
            }
            catch {
                existingDirectory = false;
            }
        }
        if (existingDirectory) {
            path = join(path, defaultFilename(format));
        }
        else if (requestedPath.endsWith("/") || requestedPath.endsWith("\\")) {
            mkdirSync(path, { recursive: true });
            path = join(path, defaultFilename(format));
        }
        else if (!extname(basename(path))) {
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
export function multiOutputPaths(base: any, suffixes: any): any {
    if (suffixes.length <= 1) {
        return [base];
    }
    const parsed = parse(base);
    return suffixes.map((suffix: any) => {
        const candidate = join(parsed.dir, `${parsed.name}-${suffix}${parsed.ext}`);
        ensureParent(candidate);
        return candidate;
    });
}
export function runCommand(cmd: any): any {
    const proc = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
    if (proc.error?.code === "ENOENT") {
        throw new Error(`required command not found: ${cmd[0]}`);
    }
    if (proc.status !== 0) {
        throw new Error(`command failed (${proc.status ?? 1}): ${cmd.join(" ")}`);
    }
}
function writeChunkText(chunk: any, encoding: any): any {
    if (Buffer.isBuffer(chunk)) {
        return chunk.toString(typeof encoding === "string" ? encoding : "utf8");
    }
    if (chunk instanceof Uint8Array) {
        return Buffer.from(chunk).toString(typeof encoding === "string" ? encoding : "utf8");
    }
    return String(chunk);
}
export function captureMainOutput(mainFn: any, args: any = []): any {
    const previousStdoutWrite = process.stdout.write;
    const previousStderrWrite = process.stderr.write;
    const previousExitCode = process.exitCode;
    let stdout = "";
    let stderr = "";
    function captureStdout(chunk: any, encodingOrCallback?: any, callback?: any): any {
        stdout += writeChunkText(chunk, encodingOrCallback);
        const done = typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
        if (done)
            done();
        return true;
    }
    function captureStderr(chunk: any, encodingOrCallback?: any, callback?: any): any {
        stderr += writeChunkText(chunk, encodingOrCallback);
        const done = typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
        if (done)
            done();
        return true;
    }
    try {
        process.stdout.write = captureStdout as any;
        process.stderr.write = captureStderr as any;
        const status = mainFn(args);
        if (status && typeof status.then === "function") {
            throw new Error("async helper output capture is not supported");
        }
        return {
            status: typeof status === "number" ? status : 0,
            stdout,
            stderr,
        };
    }
    finally {
        process.stdout.write = previousStdoutWrite;
        process.stderr.write = previousStderrWrite;
        process.exitCode = previousExitCode;
    }
}
export function helperJson(mainFn: any, extraArgs: any = []): any {
    const proc = mainFn(extraArgs);
    if (proc.status !== 0) {
        const stderr = (proc.stderr ?? "").trim();
        if (stderr.includes("ModuleCache") && stderr.includes("Operation not permitted")) {
            throw new Error("macOS native helper needs module-cache access; rerun with escalated permissions");
        }
        throw new Error(stderr || (proc.stdout ?? "").trim() || "macOS native helper failed");
    }
    try {
        return JSON.parse(proc.stdout);
    }
    catch {
        throw new Error(`macOS native helper returned invalid JSON: ${proc.stdout.trim()}`);
    }
}
export function macosScreenCaptureGranted(request: any = false): any {
    const payload = helperJson(runMacosPermissions, request ? ["--request"] : []);
    return Boolean(payload.screenCapture);
}
export function ensureMacosPermissions(): any {
    if (process.env.CODEX_SANDBOX) {
        throw new Error("screen capture checks are blocked in the sandbox; rerun with escalated permissions");
    }
    if (macosScreenCaptureGranted()) {
        return;
    }
    console.log(`This workflow needs macOS Screen Recording permission to capture screenshots.
macOS will show a single system prompt for Screen Recording. Approve it, then
return here. If macOS opens System Settings instead of prompting, enable Screen
Recording for your terminal and rerun the command.`);
    macosScreenCaptureGranted(true);
    if (!macosScreenCaptureGranted()) {
        console.log(`Screen Recording is still not granted.
Open System Settings > Privacy & Security > Screen Recording and enable it for
your terminal (and Codex if needed), then rerun your screenshot command.`);
        throw new Error("Screen Recording permission is required; enable it in System Settings and retry");
    }
    console.log("Screen Recording permission granted.");
}
export function activateApp(app: any): any {
    const safeApp = app.replaceAll('"', '\\"');
    spawnSync("osascript", ["-e", `tell application "${safeApp}" to activate`], {
        encoding: "utf-8",
    });
}
export function macosWindowPayload(args: any, frontmost: any, includeList: any): any {
    const flags: any[] = [];
    if (frontmost)
        flags.push("--frontmost");
    if (args.app)
        flags.push("--app", args.app);
    if (args.windowName)
        flags.push("--window-name", args.windowName);
    if (includeList)
        flags.push("--list");
    return helperJson(runMacosWindowInfo, flags);
}
export function macosDisplayIndexes(): any {
    const payload = helperJson(runMacosDisplayInfo);
    const displays = payload.displays ?? [];
    const indexes = displays
        .map((item: any) => Number.parseInt(String(item), 10))
        .filter((item: any) => Number.isInteger(item) && item > 0);
    return indexes.length ? indexes : [1];
}
export function macosWindowIds(args: any, captureAll: any): any {
    const payload = macosWindowPayload(args, args.activeWindow, captureAll);
    if (captureAll) {
        const ids = (payload.windows ?? [])
            .map((item: any) => Number.parseInt(String(item.id), 10))
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
export function listMacosWindows(args: any): any {
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
export function listTestMacosWindows(args: any): any {
    const owner = args.app || "TestApp";
    const name = args.windowName || "";
    let ids = testWindowIds();
    if (args.activeWindow && ids.length) {
        ids = [ids[0]];
    }
    ids.forEach((winId: any, index: any) => {
        const windowName = name || `Window ${index + 1}`;
        console.log(`${winId}\t${owner}\t${windowName}\t800x600+0+0`);
    });
}
export function resolveMacosWindows(args: any): any {
    if (args.app) {
        activateApp(args.app);
    }
    return macosWindowIds(args, !args.activeWindow);
}
export function resolveTestMacosWindows(args: any): any {
    const ids = testWindowIds();
    if (args.activeWindow && ids.length) {
        return [ids[0]];
    }
    return ids;
}
export function captureMacos(args: any, output: any, options: any = {}): any {
    const cmd: any[] = ["screencapture", "-x", `-t${args.format}`];
    if (args.interactive)
        cmd.push("-i");
    if (options.display != null)
        cmd.push(`-D${options.display}`);
    const effectiveWindowId = options.windowId ?? args.windowId;
    if (effectiveWindowId != null) {
        cmd.push(`-l${effectiveWindowId}`);
    }
    else if (args.region) {
        const [x, y, width, height] = args.region;
        cmd.push(`-R${x},${y},${width},${height}`);
    }
    cmd.push(output);
    runCommand(cmd);
}
function which(command: any): any {
    const paths = (process.env.PATH ?? "").split(process.platform === "win32" ? ";" : ":").filter(Boolean);
    const extensions = process.platform === "win32"
        ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
        : [""];
    for (const dir of paths) {
        for (const ext of extensions) {
            const candidate = resolve(dir, process.platform === "win32" ? `${command}${ext}` : command);
            if (existsSync(candidate))
                return candidate;
        }
    }
    return null;
}
export function captureLinux(args: any, output: any): any {
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
export function captureWindows(args: any, output: any): any {
    const cmd: any[] = ["--path", output, "--format", args.format];
    if (args.region) {
        cmd.push("--region", args.region.join(","));
    }
    if (args.activeWindow) {
        cmd.push("--active-window");
    }
    if (args.windowId != null) {
        cmd.push("--window-handle", String(args.windowId));
    }
    const proc = captureMainOutput(runWindowsScreenshot, cmd);
    if (proc.status !== 0) {
        throw new Error((proc.stderr || proc.stdout || "Windows screenshot capture failed").trim());
    }
}
function usage(): any {
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
export function parseArgs(argv: any = process.argv.slice(2)): any {
    const args: Record<string, any> = {
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
        if (arg === "--path")
            args.path = value;
        if (arg === "--mode")
            args.mode = value;
        if (arg === "--format")
            args.format = value;
        if (arg === "--app")
            args.app = value;
        if (arg === "--window-name")
            args.windowName = value;
        if (arg === "--region")
            args.region = parseRegion(value);
        if (arg === "--window-id") {
            const parsed = Number.parseInt(value, 10);
            if (!Number.isInteger(parsed))
                throw new Error("window-id must be an integer");
            args.windowId = parsed;
        }
    }
    if (!["default", "temp"].includes(args.mode)) {
        throw new Error("--mode must be one of: default, temp");
    }
    return args;
}
function validateArgs(args: any): any {
    if (args.region && args.windowId != null)
        throw new Error("choose either --region or --window-id, not both");
    if (args.region && args.activeWindow)
        throw new Error("choose either --region or --active-window, not both");
    if (args.windowId != null && args.activeWindow)
        throw new Error("choose either --window-id or --active-window, not both");
    if (args.app && args.windowId != null)
        throw new Error("choose either --app or --window-id, not both");
    if (args.region && args.app)
        throw new Error("choose either --region or --app, not both");
    if (args.region && args.windowName)
        throw new Error("choose either --region or --window-name, not both");
    if (args.interactive && args.app)
        throw new Error("choose either --interactive or --app, not both");
    if (args.interactive && args.windowName)
        throw new Error("choose either --interactive or --window-name, not both");
    if (args.interactive && args.windowId != null)
        throw new Error("choose either --interactive or --window-id, not both");
    if (args.interactive && args.activeWindow)
        throw new Error("choose either --interactive or --active-window, not both");
    if (args.listWindows && (args.region || args.windowId != null || args.interactive)) {
        throw new Error("--list-windows only supports --app, --window-name, and --active-window");
    }
}
function printPaths(paths: any): any {
    for (const path of paths) {
        console.log(path);
    }
}
export function main(argv: any = process.argv.slice(2)): any {
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
    let windowIds: any[] = [];
    let displayIds: any[] = [];
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
            }
            else if (args.app || args.windowName || args.activeWindow) {
                windowIds = resolveTestMacosWindows(args);
            }
            else if (!args.region && !args.interactive) {
                displayIds = testDisplayIds();
            }
        }
        else {
            ensureMacosPermissions();
            if (args.listWindows) {
                listMacosWindows(args);
                return 0;
            }
            if (args.windowId != null) {
                windowIds = [args.windowId];
            }
            else if (args.app || args.windowName || args.activeWindow) {
                windowIds = resolveMacosWindows(args);
            }
            else if (!args.region && !args.interactive) {
                displayIds = macosDisplayIndexes();
            }
        }
    }
    const output = resolveOutputPath(args.path, args.mode, args.format, system);
    if (testMode) {
        if (system === "Darwin") {
            if (windowIds.length) {
                const paths = multiOutputPaths(output, windowIds.map((winId: any) => `w${winId}`));
                for (const path of paths)
                    writeTestPng(path);
                printPaths(paths);
                return 0;
            }
            if (displayIds.length > 1) {
                const paths = multiOutputPaths(output, displayIds.map((displayId: any) => `d${displayId}`));
                for (const path of paths)
                    writeTestPng(path);
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
            const paths = multiOutputPaths(output, windowIds.map((winId: any) => `w${winId}`));
            windowIds.forEach((winId: any, index: any) => captureMacos(args, paths[index], { windowId: winId }));
            printPaths(paths);
            return 0;
        }
        if (displayIds.length > 1) {
            const paths = multiOutputPaths(output, displayIds.map((displayId: any) => `d${displayId}`));
            displayIds.forEach((displayId: any, index: any) => captureMacos(args, paths[index], { display: displayId }));
            printPaths(paths);
            return 0;
        }
        captureMacos(args, output);
    }
    else if (system === "Linux") {
        captureLinux(args, output);
    }
    else if (system === "Windows") {
        captureWindows(args, output);
    }
    else {
        throw new Error(`unsupported platform: ${system}`);
    }
    console.log(output);
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        process.exitCode = main();
    }
    catch (error: any) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
