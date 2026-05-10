#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getRepoRoot, printHelpAndExit, printErrorAndExit } from "./common";
import { assertOutputWritable } from "./output_guard";

export const procedure = defineCliProcedure({
  id: "speckit-baseline-create-new-feature",
  entry: procedureEntry(import.meta.url),
  description:
    "创建新 feature 目录结构：根据功能描述文本生成 slug，在 .specify/features/ 下创建目录并初始化 feature.json，输出 FEATURE_DIR、SPEC_FILE、SLUG 信息。",
  owners: { skillIds: ["speckit-baseline"] },
  target: "scripts/create-new-feature.mjs",
  runtime: "node",
  params: [
    { flag: "--json", type: "", description: "JSON 格式输出", required: false },
    {
      flag: "--short-name",
      type: "字符串",
      description: "手动指定 slug 短名，而非从描述自动生成",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "仅在用户已明确确认可替换现有 .specify/feature.json 当前 feature 指针后使用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--short-name", "user-auth", "用户登录功能"] },
});

function slugFromText(text: any): any {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const parts = normalized
    ? normalized.split("-").filter(Boolean).slice(0, 4)
    : [];
  if (parts.length > 0) {
    return parts.join("-");
  }
  const hash = crypto
    .createHash("sha1")
    .update(text, "utf8")
    .digest("hex")
    .slice(0, 8);
  return `feature-${hash}`;
}
export function parseArgs(argv: readonly string[]): any {
  let jsonMode = false;
  let shortName = "";
  let overwrite = false;
  const descriptionParts: any[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      jsonMode = true;
      continue;
    }
    if (arg === "--overwrite") {
      overwrite = true;
      continue;
    }
    if (arg === "--short-name") {
      const value = argv[i + 1] ?? "";
      if (!value) {
        printErrorAndExit("Error: --short-name requires a value");
      }
      shortName = value;
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelpAndExit(
        "Usage: node create-new-feature.mjs [--json] [--short-name <slug>] [--overwrite] <feature description>",
      );
    }
    if (arg.startsWith("-")) {
      printErrorAndExit(`Error: unknown option '${arg}'`);
    }
    descriptionParts.push(arg);
  }
  const featureDescription = descriptionParts.join(" ").trim();
  if (!featureDescription) {
    printErrorAndExit("Error: feature description is required");
  }
  return { jsonMode, shortName, featureDescription, overwrite };
}
export function writeCurrentFeatureJson(
  repoRoot: any,
  slug: any,
  overwrite: any = false,
): any {
  const featureJsonPath = path.join(repoRoot, ".specify", "feature.json");
  const featureJson: Record<string, any> = {
    feature_directory: `.specify/features/${slug}`,
  };
  const content = `${JSON.stringify(featureJson, null, 2)}\n`;
  if (
    fs.existsSync(featureJsonPath) &&
    fs.readFileSync(featureJsonPath, "utf8") !== content
  ) {
    assertOutputWritable(featureJsonPath, overwrite);
  }
  fs.writeFileSync(featureJsonPath, content, "utf8");
  return featureJsonPath;
}
export function main(argv: readonly string[]): any {
  const { jsonMode, shortName, featureDescription, overwrite } =
    parseArgs(argv);
  let slug = shortName
    ? slugFromText(shortName)
    : slugFromText(featureDescription);
  if (!slug) {
    slug = "feature";
  }
  const repoRoot = getRepoRoot();
  const featureDir = path.join(repoRoot, ".specify", "features", slug);
  const specFile = path.join(featureDir, "spec.md");
  fs.mkdirSync(featureDir, { recursive: true });
  fs.mkdirSync(path.join(repoRoot, ".specify"), { recursive: true });
  writeCurrentFeatureJson(repoRoot, slug, overwrite);
  const result: Record<string, any> = {
    FEATURE_DIR: featureDir,
    SPEC_FILE: specFile,
    SLUG: slug,
    BRANCH_CREATED: false,
  };
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  process.stdout.write(`FEATURE_DIR: ${result.FEATURE_DIR}\n`);
  process.stdout.write(`SPEC_FILE: ${result.SPEC_FILE}\n`);
  process.stdout.write(`SLUG: ${result.SLUG}\n`);
  process.stdout.write("BRANCH_CREATED: false\n");
}
