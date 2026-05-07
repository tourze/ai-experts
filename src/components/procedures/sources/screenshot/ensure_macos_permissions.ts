#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
function showHelp(): any {
    console.log(`macOS screenshot permission check

Usage: node scripts/ensure_macos_permissions.mjs

Checks and requests Screen Recording permission before screenshot capture.`);
}
if (process.argv.includes("--help") || process.argv.includes("-h")) {
    showHelp();
    process.exit(0);
}
if (process.platform !== "darwin") {
    console.error("ensure_macos_permissions.mjs only supports macOS");
    process.exit(1);
}
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const permHelper = path.join(scriptDir, "macos_permissions.mjs");
function screenCaptureGranted(args: any = []): any {
    const result = spawnSync(process.execPath, [permHelper, ...args], {
        encoding: "utf8",
    });
    if (result.status !== 0) {
        process.stderr.write(result.stderr || result.stdout || "macOS native helper failed\n");
        process.exit(result.status ?? 1);
    }
    try {
        return Boolean(JSON.parse(result.stdout).screenCapture);
    }
    catch {
        console.error(`macOS native helper returned invalid JSON: ${result.stdout.trim()}`);
        process.exit(1);
    }
}
if (process.env.CODEX_SANDBOX) {
    console.error("Screen capture checks are blocked in the sandbox; rerun with escalated permissions.");
    process.exit(3);
}
if (screenCaptureGranted()) {
    console.log("Screen Recording permission already granted.");
    process.exit(0);
}
console.log(`This workflow needs macOS Screen Recording permission to capture screenshots.
macOS will show a single system prompt for Screen Recording. Approve it, then
return here. If macOS opens System Settings instead of prompting, enable Screen
Recording for your terminal and rerun the command.`);
screenCaptureGranted(["--request"]);
if (!screenCaptureGranted()) {
    console.log(`Screen Recording is still not granted.
Open System Settings > Privacy & Security > Screen Recording and enable it for
your terminal (and Codex if needed), then rerun your screenshot command.`);
    process.exit(2);
}
console.log("Screen Recording permission granted.");
