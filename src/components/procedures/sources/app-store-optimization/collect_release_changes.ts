#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";

export const procedure = defineCliProcedure({
  id: "app-store-optimization-collect-release-changes",
  entry: procedureEntry(import.meta.url),
  description:
    "从 Git 历史收集最近一个 tag 到当前版本的提交记录和文件改动清单。",
  owners: { skillIds: ["app-store-optimization"] },
  target: "scripts/collect_release_changes.mjs",
  runtime: "node",
  params: [
    {
      flag: "[sinceRef]",
      type: "字符串",
      description: "起始 Git 引用（tag/commit），默认最近 tag",
      required: false,
    },
    {
      flag: "[untilRef]",
      type: "字符串",
      description: "截止 Git 引用，默认 HEAD",
      required: false,
    },
  ],

  exampleArgs: { args: ["v1.0", "HEAD"] },
});

export function main(argv: readonly string[]): any {
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
  let sinceRef = argv[0] ?? "";
  const untilRef = argv[1] ?? "HEAD";
  if (!sinceRef) {
    sinceRef = maybeGitOutput(["describe", "--tags", "--abbrev=0"]);
  }
  const range = sinceRef ? `${sinceRef}..${untilRef}` : untilRef;
  const repoRoot = gitOutput(["rev-parse", "--show-toplevel"]);
  console.log(`Repo: ${repoRoot}`);
  if (sinceRef) {
    console.log(`Range: ${sinceRef}..${untilRef}`);
  } else {
    console.log(`Range: start..${untilRef} (no tags found)`);
  }
  console.log("");
  console.log("== Commits ==");
  process.stdout.write(
    gitOutput([
      "log",
      "--reverse",
      "--date=short",
      "--pretty=format:%h|%ad|%s",
      range,
    ]),
  );
  console.log("");
  console.log("");
  console.log("== Files Touched ==");
  const filesTouched = gitOutput([
    "log",
    "--reverse",
    "--name-only",
    "--pretty=format:--- %h %s",
    range,
  ])
    .split(/\r?\n/)
    .filter((line: any): any => line.trim().length > 0)
    .join("\n");
  process.stdout.write(filesTouched);
}
