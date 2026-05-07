#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
export class LogMonitor {
    appBundleId: any;
    debugCount: any;
    deviceUdid: any;
    errorCount: any;
    errors: any;
    infoCount: any;
    infoMessages: any;
    interrupted: any;
    logLines: any;
    logProcess: any;
    seenMessages: any;
    severityFilter: any;
    totalLines: any;
    warningCount: any;
    warnings: any;
    constructor({ appBundleId = null, deviceUdid = null, severityFilter = null }: any = {}) {
        this.appBundleId = appBundleId;
        this.deviceUdid = deviceUdid || "booted";
        this.severityFilter = severityFilter ?? ["error", "warning", "info", "debug"];
        this.logLines = [];
        this.errors = [];
        this.warnings = [];
        this.infoMessages = [];
        this.errorCount = 0;
        this.warningCount = 0;
        this.infoCount = 0;
        this.debugCount = 0;
        this.totalLines = 0;
        this.seenMessages = new Set();
        this.logProcess = null;
        this.interrupted = false;
    }
    parseTimeDuration(duration: any): any {
        return parseTimeDuration(duration);
    }
    classifyLogLine(line: any): any {
        return classifyLogLine(line);
    }
    deduplicateMessage(line: any): any {
        const signature = line
            .replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g, "")
            .replace(/\[\d+\]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        if (this.seenMessages.has(signature))
            return false;
        this.seenMessages.add(signature);
        return true;
    }
    processLogLine(line: any): any {
        if (!line.trim())
            return;
        this.totalLines += 1;
        this.logLines.push(line);
        const severity = this.classifyLogLine(line);
        if (!this.severityFilter.includes(severity))
            return;
        if (["error", "warning"].includes(severity) && !this.deduplicateMessage(line))
            return;
        if (severity === "error") {
            this.errorCount += 1;
            this.errors.push(line);
        }
        else if (severity === "warning") {
            this.warningCount += 1;
            this.warnings.push(line);
        }
        else if (severity === "info") {
            this.infoCount += 1;
            if (this.infoMessages.length < 20)
                this.infoMessages.push(line);
        }
        else {
            this.debugCount += 1;
        }
    }
    streamLogs({ follow = false, duration = null, lastMinutes = null }: any = {}): any {
        return new Promise((resolve: any) => {
            const command = buildLogCommand({
                appBundleId: this.appBundleId,
                deviceUdid: this.deviceUdid,
                lastMinutes,
            });
            this.logProcess = spawn(command[0], command.slice(1), {
                stdio: ["ignore", "pipe", "pipe"],
            });
            this.logProcess.stdout.setEncoding("utf8");
            this.logProcess.stderr.setEncoding("utf8");
            const startedAt = Date.now();
            let resolved = false;
            const finish = (success: any) => {
                if (resolved)
                    return;
                resolved = true;
                resolve(success);
            };
            this.logProcess.stdout.on("data", (chunk: any) => {
                for (const line of chunk.split(/\r?\n/)) {
                    if (!line)
                        continue;
                    this.processLogLine(line);
                    const severity = this.classifyLogLine(line);
                    if (follow && this.severityFilter.includes(severity))
                        console.log(line);
                    if (duration && Date.now() - startedAt >= duration * 1000) {
                        this.logProcess.kill("SIGTERM");
                        finish(true);
                    }
                    if (this.interrupted) {
                        this.logProcess.kill("SIGTERM");
                        finish(true);
                    }
                }
            });
            this.logProcess.on("error", (error: any) => {
                console.error(`Error streaming logs: ${error.message}`);
                finish(false);
            });
            this.logProcess.on("close", () => finish(true));
            if (duration) {
                setTimeout(() => {
                    this.logProcess?.kill("SIGTERM");
                    finish(true);
                }, duration * 1000);
            }
        });
    }
    getSummary({ verbose = false }: any = {}): any {
        const lines: any[] = [];
        lines.push(this.appBundleId ? `Logs for: ${this.appBundleId}` : "Logs for: All processes");
        lines.push(`Total lines: ${this.totalLines}`);
        lines.push(`Errors: ${this.errorCount}, Warnings: ${this.warningCount}, Info: ${this.infoCount}`);
        if (this.errors.length) {
            lines.push(`\nTop Errors (${this.errors.length}):`);
            for (const error of this.errors.slice(0, 5))
                lines.push(`  ERROR ${error.slice(0, 120)}`);
        }
        if (this.warnings.length) {
            lines.push(`\nTop Warnings (${this.warnings.length}):`);
            for (const warning of this.warnings.slice(0, 5))
                lines.push(`  WARNING ${warning.slice(0, 120)}`);
        }
        if (verbose && this.logLines.length) {
            lines.push("\n=== Recent Log Lines ===");
            lines.push(...this.logLines.slice(-50));
        }
        return lines.join("\n");
    }
    getJsonOutput(): any {
        return {
            app_bundle_id: this.appBundleId,
            device_udid: this.deviceUdid,
            statistics: {
                total_lines: this.totalLines,
                errors: this.errorCount,
                warnings: this.warningCount,
                info: this.infoCount,
                debug: this.debugCount,
            },
            errors: this.errors.slice(0, 20),
            warnings: this.warnings.slice(0, 20),
            sample_logs: this.logLines.slice(-50),
        };
    }
    saveLogs(outputDir: any): any {
        mkdirSync(outputDir, { recursive: true });
        const timestamp = timestampForFile(new Date());
        const appName = this.appBundleId ? this.appBundleId.split(".").at(-1) : "simulator";
        const logFile = join(outputDir, `${appName}-${timestamp}.log`);
        const jsonFile = join(outputDir, `${appName}-${timestamp}-summary.json`);
        writeFileSync(logFile, this.logLines.join("\n"));
        writeFileSync(jsonFile, `${JSON.stringify(this.getJsonOutput(), null, 2)}\n`);
        return logFile;
    }
}
export function parseTimeDuration(duration: any): any {
    const match = String(duration).toLowerCase().match(/^(\d+)([smh])$/);
    if (!match)
        throw new Error(`Invalid duration format: ${duration}. Use format like '30s', '5m', '1h'`);
    const value = Number.parseInt(match[1], 10);
    if (match[2] === "s")
        return value;
    if (match[2] === "m")
        return value * 60;
    if (match[2] === "h")
        return value * 3600;
    return 0;
}
export function classifyLogLine(line: any): any {
    const lower = line.toLowerCase();
    if ([/\berror\b/, /\bfault\b/, /\bfailed\b/, /\bexception\b/, /\bcrash\b/].some((pattern: any) => pattern.test(lower))) {
        return "error";
    }
    if ([/\bwarning\b/, /\bwarn\b/, /\bdeprecated\b/].some((pattern: any) => pattern.test(lower)))
        return "warning";
    if ([/\binfo\b/, /\bnotice\b/].some((pattern: any) => pattern.test(lower)))
        return "info";
    return "debug";
}
export function buildLogCommand({ appBundleId = null, deviceUdid = "booted", lastMinutes = null }: any = {}): any {
    const command: any[] = ["xcrun", "simctl", "spawn", deviceUdid, "log", "stream"];
    if (appBundleId) {
        const appName = appBundleId.split(".").at(-1);
        command.push("--predicate", `processImagePath CONTAINS "${appName}"`);
    }
    if (lastMinutes) {
        command.push("--start", formatDateForLogStart(new Date(Date.now() - lastMinutes * 60 * 1000)));
    }
    return command;
}
function formatDateForLogStart(date: any): any {
    const pad = (value: any) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function timestampForFile(date: any): any {
    return formatDateForLogStart(date).replaceAll("-", "").replace(" ", "-").replaceAll(":", "");
}
function usage(): any {
    return `Monitor and analyze iOS simulator logs.

Usage: node scripts/log_monitor.mjs [options]

Options:
  --app <bundle-id>         App bundle ID to filter logs
  --device-udid <udid>      Device UDID (uses booted if not specified)
  --severity <levels>       Comma-separated severity levels
  --follow                  Follow mode
  --duration <duration>     Capture duration (30s, 5m, 1h)
  --last <duration>         Show logs from last duration
  --output <dir>            Save logs to directory
  --verbose                 Show detailed output
  --json                    Output as JSON
  --help                    Show this help
`;
}
export function parseArgs(argv: any = process.argv.slice(2)): any {
    const args: Record<string, any> = {
        appBundleId: null,
        deviceUdid: null,
        severity: null,
        follow: false,
        duration: null,
        lastMinutes: null,
        output: null,
        verbose: false,
        json: false,
        help: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--help" || arg === "-h")
            args.help = true;
        else if (arg === "--follow")
            args.follow = true;
        else if (arg === "--verbose")
            args.verbose = true;
        else if (arg === "--json")
            args.json = true;
        else if (["--app", "--device-udid", "--severity", "--duration", "--last", "--output"].includes(arg)) {
            const value = argv[index + 1];
            if (value == null || value.startsWith("--"))
                throw new Error(`${arg} requires a value`);
            index += 1;
            if (arg === "--app")
                args.appBundleId = value;
            if (arg === "--device-udid")
                args.deviceUdid = value;
            if (arg === "--severity")
                args.severity = value;
            if (arg === "--duration")
                args.duration = value;
            if (arg === "--last")
                args.lastMinutes = value;
            if (arg === "--output")
                args.output = value;
        }
        else {
            throw new Error(`unrecognized argument: ${arg}`);
        }
    }
    const timeOptions = [args.follow, args.duration != null, args.lastMinutes != null].filter(Boolean);
    if (timeOptions.length > 1)
        throw new Error("--follow, --duration, and --last are mutually exclusive");
    return args;
}
export async function main(argv: any = process.argv.slice(2)): Promise<any> {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(usage());
        return 0;
    }
    const severityFilter = args.severity ? args.severity.split(",").map((item: any) => item.trim().toLowerCase()) : null;
    const monitor = new LogMonitor({
        appBundleId: args.appBundleId,
        deviceUdid: args.deviceUdid,
        severityFilter,
    });
    const duration = args.duration ? monitor.parseTimeDuration(args.duration) : null;
    const lastMinutes = args.lastMinutes ? monitor.parseTimeDuration(args.lastMinutes) / 60 : null;
    console.error("Monitoring logs...");
    if (args.appBundleId)
        console.error(`App: ${args.appBundleId}`);
    process.once("SIGINT", () => {
        monitor.interrupted = true;
        monitor.logProcess?.kill("SIGTERM");
    });
    const success = await monitor.streamLogs({ follow: args.follow, duration, lastMinutes });
    if (!success)
        return 1;
    if (args.output) {
        const logFile = monitor.saveLogs(args.output);
        console.error(`\nLogs saved to: ${logFile}`);
    }
    if (!args.follow) {
        if (args.json)
            console.log(JSON.stringify(monitor.getJsonOutput(), null, 2));
        else
            console.log(`\n${monitor.getSummary({ verbose: args.verbose })}`);
    }
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        process.exitCode = await main();
    }
    catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
    }
}
