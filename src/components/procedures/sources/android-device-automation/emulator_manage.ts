#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAdbCommand } from "./common";
export function getEmulatorPath(env: any = process.env): any {
    const binary = process.platform === "win32" ? "emulator.exe" : "emulator";
    if (env.ANDROID_HOME) {
        const emulatorPath = join(env.ANDROID_HOME, "emulator", binary);
        if (existsSync(emulatorPath))
            return emulatorPath;
    }
    const result = spawnSync("emulator", ["-version"], { stdio: "ignore" });
    if (result.status === 0)
        return "emulator";
    return "emulator";
}
export function parseAvdList(output: any): any {
    return output
        .split(/\r?\n/)
        .map((line: any) => line.trim())
        .filter(Boolean);
}
export function listAvds(): any {
    const emulator = getEmulatorPath();
    const result = spawnSync(emulator, ["-list-avds"], { encoding: "utf8" });
    if (result.status !== 0)
        return [];
    return parseAvdList(result.stdout ?? "");
}
export function bootAvd(avdName: any): any {
    const emulator = getEmulatorPath();
    console.log(`Booting ${avdName}...`);
    try {
        const child = spawn(emulator, ["-avd", avdName], {
            detached: true,
            stdio: "ignore",
        });
        child.unref();
        console.log(`Emulator ${avdName} started.`);
        return true;
    }
    catch (error: any) {
        console.log(`Failed to boot: ${error.message}`);
        return false;
    }
}
export function shutdownEmulator(serial: any): any {
    try {
        runAdbCommand(["emu", "kill"], serial);
        console.log(`Shutdown signal sent to ${serial}`);
        return true;
    }
    catch {
        console.log(`Failed to shutdown ${serial}`);
        return false;
    }
}
function usage(): any {
    return `Manage Android emulators.

Usage: node scripts/emulator_manage.mjs [action]

Actions:
  --list                 List available AVDs
  --boot <name>          Boot AVD by name
  --shutdown <serial>    Shutdown emulator by serial

Options:
  --json                 Reserved for future structured output
  --help                 Show this help
`;
}
export function parseArgs(argv: any = process.argv.slice(2)): any {
    const args: Record<string, any> = { list: false, boot: null, shutdown: null, json: false, help: false };
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
        if (arg === "--boot" || arg === "--shutdown") {
            const value = argv[index + 1];
            if (value == null || value.startsWith("--"))
                throw new Error(`${arg} requires a value`);
            index += 1;
            if (arg === "--boot")
                args.boot = value;
            if (arg === "--shutdown")
                args.shutdown = value;
            continue;
        }
        throw new Error(`unrecognized argument: ${arg}`);
    }
    return args;
}
export function main(argv: any = process.argv.slice(2)): any {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(usage());
        return 0;
    }
    if (args.list) {
        console.log("Available AVDs:");
        for (const avd of listAvds()) {
            console.log(`  - ${avd}`);
        }
    }
    else if (args.boot) {
        return bootAvd(args.boot) ? 0 : 1;
    }
    else if (args.shutdown) {
        return shutdownEmulator(args.shutdown) ? 0 : 1;
    }
    else {
        console.log(usage());
    }
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        process.exitCode = main();
    }
    catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
    }
}
