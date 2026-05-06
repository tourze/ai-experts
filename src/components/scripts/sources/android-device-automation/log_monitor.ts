#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ADB_PATH, resolveSerial, runAdbCommand } from "./common";
import { realpathSync } from "node:fs";
export function buildLogcatCommand(args: any, serial: any, pid: any = null): any {
    let command: any[] = ["logcat", "-v", "color", `*:${args.priority}`];
    if (args.tag) {
        command = ["logcat", "-v", "color", "-s", args.tag];
    }
    const fullCommand: any[] = [ADB_PATH];
    if (serial)
        fullCommand.push("-s", serial);
    fullCommand.push(...command);
    if (pid) {
        fullCommand.push(`--pid=${pid}`);
    }
    return fullCommand;
}
function usage(): any {
    return `Monitor Android logs.

Usage: node scripts/log_monitor.mjs [options]

Options:
  --package <name>       Filter by package name when the app is running
  --tag <tag>            Filter by log tag
  --priority <level>     Minimum priority V|D|I|W|E|F (default: V)
  --grep <pattern>       Grep filter applied in Node
  --clear, -c            Clear logs first
  --serial, -s <serial>  Device serial
  --help                 Show this help
`;
}
export function parseArgs(argv: any = process.argv.slice(2)): any {
    const args: Record<string, any> = {
        packageName: null,
        tag: null,
        priority: "V",
        grep: null,
        clear: false,
        serial: null,
        help: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--help" || arg === "-h") {
            args.help = true;
            continue;
        }
        if (arg === "--clear" || arg === "-c") {
            args.clear = true;
            continue;
        }
        if (["--package", "--tag", "--priority", "--grep", "--serial", "-s"].includes(arg)) {
            const value = argv[index + 1];
            if (value == null || value.startsWith("--"))
                throw new Error(`${arg} requires a value`);
            index += 1;
            if (arg === "--package")
                args.packageName = value;
            if (arg === "--tag")
                args.tag = value;
            if (arg === "--priority")
                args.priority = value;
            if (arg === "--grep")
                args.grep = value;
            if (arg === "--serial" || arg === "-s")
                args.serial = value;
            continue;
        }
        throw new Error(`unrecognized argument: ${arg}`);
    }
    if (!["V", "D", "I", "W", "E", "F"].includes(args.priority)) {
        throw new Error("--priority must be one of: V, D, I, W, E, F");
    }
    return args;
}
export function resolvePackagePid(packageName: any, serial: any): any {
    const result = runAdbCommand(["shell", "pidof", packageName], serial, { check: false });
    return (result.stdout ?? "").trim();
}
export function main(argv: any = process.argv.slice(2)): any {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(usage());
        return 0;
    }
    const serial = resolveSerial(args.serial);
    if (args.clear) {
        runAdbCommand(["logcat", "-c"], serial);
        console.log("Logs cleared.");
    }
    let pid: any = null;
    if (args.packageName) {
        try {
            pid = resolvePackagePid(args.packageName, serial);
            if (pid) {
                console.log(`Filtering for package ${args.packageName} (PID: ${pid})`);
            }
            else {
                console.log(`Package ${args.packageName} not running. Showing all logs.`);
            }
        }
        catch {
            // Keep old behavior: package PID lookup failure should not stop logcat.
        }
    }
    const command = buildLogcatCommand(args, serial, pid);
    console.log(`Running: ${command.join(" ")}`);
    const child = spawn(command[0], command.slice(1), { stdio: ["ignore", "pipe", "inherit"] });
    child.stdout.setEncoding("utf-8");
    child.stdout.on("data", (chunk: any) => {
        for (const line of chunk.split(/(?<=\n)/)) {
            if (!line)
                continue;
            if (args.grep && !line.includes(args.grep))
                continue;
            process.stdout.write(line);
        }
    });
    child.on("exit", (code: any) => {
        process.exitCode = code ?? 0;
    });
    child.on("error", (error: any) => {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
    });
    process.on("SIGINT", () => {
        child.kill("SIGINT");
        process.exitCode = 0;
    });
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const result = main();
        if (result !== 0)
            process.exitCode = result;
    }
    catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
    }
}
