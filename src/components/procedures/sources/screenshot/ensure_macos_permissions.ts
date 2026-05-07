#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { runMacosPermissions } from "./macos_permissions";
function showHelp(): any {
    console.log(`macOS screenshot permission check

Usage: node scripts/ensure_macos_permissions.mjs

Checks and requests Screen Recording permission before screenshot capture.`);
}
function screenCaptureGranted(args: any = []): any {
    const result = runMacosPermissions(args);
    if (result.status !== 0) {
        process.stderr.write(result.stderr || result.stdout || "macOS native helper failed\n");
        return null;
    }
    try {
        return Boolean(JSON.parse(result.stdout).screenCapture);
    }
    catch {
        console.error(`macOS native helper returned invalid JSON: ${result.stdout.trim()}`);
        return null;
    }
}
export function main(argv: any = process.argv.slice(2)): any {
    if (argv.includes("--help") || argv.includes("-h")) {
        showHelp();
        return 0;
    }
    if (process.platform !== "darwin") {
        console.error("ensure_macos_permissions.mjs only supports macOS");
        return 1;
    }
    if (process.env.CODEX_SANDBOX) {
        console.error("Screen capture checks are blocked in the sandbox; rerun with escalated permissions.");
        return 3;
    }
    const initialStatus = screenCaptureGranted();
    if (initialStatus == null) {
        return 1;
    }
    if (initialStatus) {
        console.log("Screen Recording permission already granted.");
        return 0;
    }
    console.log(`This workflow needs macOS Screen Recording permission to capture screenshots.
macOS will show a single system prompt for Screen Recording. Approve it, then
return here. If macOS opens System Settings instead of prompting, enable Screen
Recording for your terminal and rerun the command.`);
    const requestedStatus = screenCaptureGranted(["--request"]);
    if (requestedStatus == null) {
        return 1;
    }
    const finalStatus = screenCaptureGranted();
    if (finalStatus == null) {
        return 1;
    }
    if (!finalStatus) {
        console.log(`Screen Recording is still not granted.
Open System Settings > Privacy & Security > Screen Recording and enable it for
your terminal (and Codex if needed), then rerun your screenshot command.`);
        return 2;
    }
    console.log("Screen Recording permission granted.");
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main();
}
