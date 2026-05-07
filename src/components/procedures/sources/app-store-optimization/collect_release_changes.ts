#!/usr/bin/env node
import { spawnSync } from "node:child_process";
function git(args: any): any {
    return spawnSync("git", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    });
}
function gitOutput(args: any): any {
    const result = git(args);
    if (result.status !== 0) {
        process.stderr.write(result.stderr || "");
        process.exit(result.status ?? 1);
    }
    return result.stdout.trimEnd();
}
function maybeGitOutput(args: any): any {
    const result = git(args);
    return result.status === 0 ? result.stdout.trimEnd() : "";
}
let sinceRef = process.argv[2] ?? "";
const untilRef = process.argv[3] ?? "HEAD";
if (!sinceRef) {
    sinceRef = maybeGitOutput(["describe", "--tags", "--abbrev=0"]);
}
const range = sinceRef ? `${sinceRef}..${untilRef}` : untilRef;
const repoRoot = gitOutput(["rev-parse", "--show-toplevel"]);
console.log(`Repo: ${repoRoot}`);
if (sinceRef) {
    console.log(`Range: ${sinceRef}..${untilRef}`);
}
else {
    console.log(`Range: start..${untilRef} (no tags found)`);
}
console.log("");
console.log("== Commits ==");
process.stdout.write(gitOutput(["log", "--reverse", "--date=short", "--pretty=format:%h|%ad|%s", range]));
console.log("");
console.log("");
console.log("== Files Touched ==");
const filesTouched = gitOutput(["log", "--reverse", "--name-only", "--pretty=format:--- %h %s", range])
    .split(/\r?\n/)
    .filter((line: any): any => line.trim().length > 0)
    .join("\n");
process.stdout.write(filesTouched);
