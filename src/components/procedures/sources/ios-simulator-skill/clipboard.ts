#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { resolveUdid, runCommand } from "./interaction_common";
import { realpathSync } from "node:fs";
export class ClipboardManager {
    udid: any;
    constructor(udid: any = null) {
        this.udid = udid;
    }
    copy(text: any): any {
        const command: any[] = ["xcrun", "simctl", "pbcopy", this.udid || "booted", text];
        return runCommand(command).status === 0;
    }
}
function usage(): any {
    return `Copy text to iOS simulator clipboard.

Usage: node scripts/clipboard.mjs --copy <text> [options]

Options:
  --copy <text>          Text to copy to clipboard
  --udid <udid>          Device UDID
  --test-name <name>     Test scenario name for tracking
  --expected <text>      Expected behavior after paste
  --help                 Show this help
`;
}
export function parseArgs(argv: any = process.argv.slice(2)): any {
    const args: Record<string, any> = { copy: null, udid: null, testName: null, expected: null, help: false };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--help" || arg === "-h")
            args.help = true;
        else if (["--copy", "--udid", "--test-name", "--expected"].includes(arg)) {
            const value = argv[index + 1];
            if (value == null || value.startsWith("--"))
                throw new Error(`${arg} requires a value`);
            index += 1;
            if (arg === "--copy")
                args.copy = value;
            if (arg === "--udid")
                args.udid = value;
            if (arg === "--test-name")
                args.testName = value;
            if (arg === "--expected")
                args.expected = value;
        }
        else {
            throw new Error(`unrecognized argument: ${arg}`);
        }
    }
    return args;
}
export function main(argv: any = process.argv.slice(2)): any {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(usage());
        return 0;
    }
    if (!args.copy) {
        console.error("Error: --copy is required");
        return 1;
    }
    const udid = resolveUdid(args.udid);
    const manager = new ClipboardManager(udid);
    if (!manager.copy(args.copy)) {
        console.log("Failed to copy text to clipboard");
        return 1;
    }
    let output = `Copied: "${args.copy}"`;
    if (args.testName)
        output += ` (test: ${args.testName})`;
    console.log(output);
    if (args.expected)
        console.log(`Expected: ${args.expected}`);
    console.log("");
    console.log("Next steps:");
    console.log("1. Tap text field with: node scripts/navigator.mjs --find-type TextField --tap");
    console.log("2. Paste with: node scripts/keyboard.mjs --key return");
    console.log("   Or use Cmd+V gesture with: node scripts/keyboard.mjs --key cmd+v");
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
