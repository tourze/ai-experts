#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import fs from "node:fs";
import {
  checkFeatureBranch,
  directoryHasEntries,
  getFeaturePaths,
  printErrorAndExit,
  printHelpAndExit,
} from "./common";

export const procedure = defineCliProcedure({
  id: "speckit-baseline-check-prerequisites",
  entry: procedureEntry(import.meta.url),
  description:
    "Spec-Driven Development 前置条件检查：验证 feature 目录、分支规范、plan.md 和可选 tasks.md 是否存在，输出当前工作路径和可用文档列表。",
  owners: { skillIds: ["speckit-baseline"] },
  target: "scripts/check-prerequisites.mjs",
  runtime: "node",
  params: [
    { flag: "--json", type: "", description: "JSON 格式输出", required: false },
    {
      flag: "--require-tasks",
      type: "",
      description: "要求 tasks.md 必须存在（实现阶段使用）",
      required: false,
    },
    {
      flag: "--include-tasks",
      type: "",
      description: "在可用文档列表中包含 tasks.md",
      required: false,
    },
    {
      flag: "--paths-only",
      type: "",
      description: "仅输出路径变量，不进行前置条件验证",
      required: false,
    },
  ],

  exampleArgs: { args: ["--json"] },
});

function parseArgs(argv: readonly string[]): any {
  let jsonMode = false;
  let requireTasks = false;
  let includeTasks = false;
  let pathsOnly = false;
  for (const arg of argv) {
    if (arg === "--json") {
      jsonMode = true;
      continue;
    }
    if (arg === "--require-tasks") {
      requireTasks = true;
      continue;
    }
    if (arg === "--include-tasks") {
      includeTasks = true;
      continue;
    }
    if (arg === "--paths-only") {
      pathsOnly = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelpAndExit(`Usage: check-prerequisites.mjs [OPTIONS]

Consolidated prerequisite checking for Spec-Driven Development workflow.

OPTIONS:
  --json              Output in JSON format
  --require-tasks     Require tasks.md to exist (for implementation phase)
  --include-tasks     Include tasks.md in AVAILABLE_DOCS list
  --paths-only        Only output path variables (no prerequisite validation)
  --help, -h          Show this help message`);
    }
    printErrorAndExit(
      `ERROR: Unknown option '${arg}'. Use --help for usage information.`,
    );
  }
  return { jsonMode, requireTasks, includeTasks, pathsOnly };
}
function printPaths(paths: any, jsonMode: any): any {
  const result: Record<string, any> = {
    REPO_ROOT: paths.REPO_ROOT,
    BRANCH: paths.CURRENT_BRANCH,
    FEATURE_DIR: paths.FEATURE_DIR,
    FEATURE_SPEC: paths.FEATURE_SPEC,
    IMPL_PLAN: paths.IMPL_PLAN,
    TASKS: paths.TASKS,
  };
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  process.stdout.write(`REPO_ROOT: ${result.REPO_ROOT}\n`);
  process.stdout.write(`BRANCH: ${result.BRANCH}\n`);
  process.stdout.write(`FEATURE_DIR: ${result.FEATURE_DIR}\n`);
  process.stdout.write(`FEATURE_SPEC: ${result.FEATURE_SPEC}\n`);
  process.stdout.write(`IMPL_PLAN: ${result.IMPL_PLAN}\n`);
  process.stdout.write(`TASKS: ${result.TASKS}\n`);
}
function printDocStatus(filePath: any, label: any): any {
  process.stdout.write(`${fs.existsSync(filePath) ? "  ✓" : "  ✗"} ${label}\n`);
}
function printDirStatus(dirPath: any, label: any): any {
  process.stdout.write(
    `${directoryHasEntries(dirPath) ? "  ✓" : "  ✗"} ${label}\n`,
  );
}
export function main(argv: readonly string[]): any {
  const { jsonMode, requireTasks, includeTasks, pathsOnly } = parseArgs(argv);
  let paths;
  try {
    paths = getFeaturePaths();
  } catch (error: any) {
    printErrorAndExit(`ERROR: ${error.message}`);
  }
  if (
    !checkFeatureBranch(
      paths.CURRENT_BRANCH,
      paths.HAS_GIT === "true",
      paths.REPO_ROOT,
    )
  ) {
    process.exit(1);
  }
  if (pathsOnly) {
    printPaths(paths, jsonMode);
    return;
  }
  if (
    !fs.existsSync(paths.FEATURE_DIR) ||
    !fs.statSync(paths.FEATURE_DIR).isDirectory()
  ) {
    printErrorAndExit(
      `ERROR: Feature directory not found: ${paths.FEATURE_DIR}\nRun /speckit.specify first to create the feature structure.`,
    );
  }
  if (
    !fs.existsSync(paths.IMPL_PLAN) ||
    !fs.statSync(paths.IMPL_PLAN).isFile()
  ) {
    printErrorAndExit(
      `ERROR: plan.md not found in ${paths.FEATURE_DIR}\nRun /speckit.plan first to create the implementation plan.`,
    );
  }
  if (
    requireTasks &&
    (!fs.existsSync(paths.TASKS) || !fs.statSync(paths.TASKS).isFile())
  ) {
    printErrorAndExit(
      `ERROR: tasks.md not found in ${paths.FEATURE_DIR}\nRun /speckit.tasks first to create the task list.`,
    );
  }
  const docs: any[] = [];
  if (fs.existsSync(paths.RESEARCH)) {
    docs.push("research.md");
  }
  if (fs.existsSync(paths.DATA_MODEL)) {
    docs.push("data-model.md");
  }
  if (directoryHasEntries(paths.CONTRACTS_DIR)) {
    docs.push("contracts/");
  }
  if (fs.existsSync(paths.QUICKSTART)) {
    docs.push("quickstart.md");
  }
  if (includeTasks && fs.existsSync(paths.TASKS)) {
    docs.push("tasks.md");
  }
  if (jsonMode) {
    process.stdout.write(
      `${JSON.stringify({ FEATURE_DIR: paths.FEATURE_DIR, AVAILABLE_DOCS: docs })}\n`,
    );
    return;
  }
  process.stdout.write(`FEATURE_DIR:${paths.FEATURE_DIR}\n`);
  process.stdout.write("AVAILABLE_DOCS:\n");
  printDocStatus(paths.RESEARCH, "research.md");
  printDocStatus(paths.DATA_MODEL, "data-model.md");
  printDirStatus(paths.CONTRACTS_DIR, "contracts/");
  printDocStatus(paths.QUICKSTART, "quickstart.md");
  if (includeTasks) {
    printDocStatus(paths.TASKS, "tasks.md");
  }
}
