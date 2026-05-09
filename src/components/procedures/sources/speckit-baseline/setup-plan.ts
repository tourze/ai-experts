#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import fs from "node:fs";
import {
  checkFeatureBranch,
  getFeaturePaths,
  printErrorAndExit,
  printHelpAndExit,
  resolveTemplate,
} from "./common";

export const procedure = defineCliProcedure({
  id: "speckit-baseline-setup-plan",
  entry: procedureEntry(import.meta.url),
  description:
    "初始化 feature 实现计划：从模板复制 plan.md 到 feature 目录，验证分支规范，输出 feature spec 和实现计划路径。",
  owners: { skillIds: ["speckit-baseline"] },
  target: "scripts/setup-plan.mjs",
  runtime: "node",
  params: [
    { flag: "--json", type: "", description: "JSON 格式输出", required: false },
  ],

  exampleArgs: { args: ["--json"] },
});

function parseArgs(argv: readonly string[]): any {
  let jsonMode = false;
  for (const arg of argv) {
    if (arg === "--json") {
      jsonMode = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelpAndExit("Usage: node setup-plan.mjs [--json]");
    }
    printErrorAndExit(
      `Error: unknown option '${arg}'. Use --help for usage information.`,
    );
  }
  return { jsonMode };
}
export function main(argv: readonly string[]): any {
  const { jsonMode } = parseArgs(argv);
  let paths;
  try {
    paths = getFeaturePaths();
  } catch (error: any) {
    printErrorAndExit(`Error: ${error.message}`);
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
  fs.mkdirSync(paths.FEATURE_DIR, { recursive: true });
  const template = resolveTemplate("plan-template", paths.REPO_ROOT);
  if (template && fs.existsSync(template)) {
    fs.copyFileSync(template, paths.IMPL_PLAN);
    const line = `Copied plan template to ${paths.IMPL_PLAN}`;
    if (jsonMode) {
      process.stderr.write(`${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  } else {
    const warning = "Warning: Plan template not found";
    if (jsonMode) {
      process.stderr.write(`${warning}\n`);
    } else {
      process.stdout.write(`${warning}\n`);
    }
    fs.closeSync(fs.openSync(paths.IMPL_PLAN, "a"));
  }
  const result: Record<string, any> = {
    FEATURE_SPEC: paths.FEATURE_SPEC,
    IMPL_PLAN: paths.IMPL_PLAN,
    SPECS_DIR: paths.FEATURE_DIR,
    BRANCH: paths.CURRENT_BRANCH,
    HAS_GIT: paths.HAS_GIT,
  };
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  process.stdout.write(`FEATURE_SPEC: ${result.FEATURE_SPEC}\n`);
  process.stdout.write(`IMPL_PLAN: ${result.IMPL_PLAN}\n`);
  process.stdout.write(`SPECS_DIR: ${result.SPECS_DIR}\n`);
  process.stdout.write(`BRANCH: ${result.BRANCH}\n`);
  process.stdout.write(`HAS_GIT: ${result.HAS_GIT}\n`);
}
