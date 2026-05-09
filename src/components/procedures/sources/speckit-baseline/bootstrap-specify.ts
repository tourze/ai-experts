#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getRepoRoot } from "./common";
import { assertOutputWritable } from "./output_guard";

export const procedure = defineCliProcedure({
  id: "speckit-baseline-bootstrap-specify",
  entry: procedureEntry(import.meta.url),
  description:
    "初始化 .specify 工作目录：从 skill assets 复制模板资源，生成脚本包装器，为 Spec-Driven Development 工作流准备基础设施。",
  owners: { skillIds: ["speckit-baseline"] },
  target: "scripts/bootstrap-specify.mjs",
  runtime: "node",
  params: [
    {
      flag: "[skillRoot]",
      type: "路径",
      description: "Speckit skill 根目录（默认自动解析当前运行时 skill 目录）",
      required: false,
    },
    {
      flag: "[targetDir]",
      type: "路径",
      description: "目标 .specify 目录路径（默认仓库根 .specify）",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "仅在用户已明确确认可替换现有 .specify wrapper/template 文件后使用",
      required: false,
    },
  ],

  exampleArgs: { args: [] },
});

const SPECKIT_SCRIPT_PROCEDURES: Record<string, string> = {
  "check-prerequisites.mjs": "speckit-baseline-check-prerequisites",
  "create-new-feature.mjs": "speckit-baseline-create-new-feature",
  "setup-plan.mjs": "speckit-baseline-setup-plan",
};
function resolveAbsolute(targetPath: any): any {
  if (!targetPath) {
    return "";
  }
  return path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(process.cwd(), targetPath);
}
function copyDirectoryContents(sourceDir: any, targetDir: any): any {
  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, targetPath);
      continue;
    }
    if (path.resolve(sourcePath) === path.resolve(targetPath)) {
      continue;
    }
    fs.copyFileSync(sourcePath, targetPath);
  }
}
function collectDirectoryTargets(sourceDir: string, targetDir: string): string[] {
  const targets: string[] = [];
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      targets.push(...collectDirectoryTargets(sourcePath, targetPath));
      continue;
    }
    targets.push(targetPath);
  }
  return targets;
}
function shellQuote(value: string): string {
  return JSON.stringify(value);
}
function wrapperSource(procedureId: string, runtimeFallback: string): string {
  return `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const procedureId = ${shellQuote(procedureId)};
const triggerSkill = "speckit-baseline";
const runtimeFallback = ${shellQuote(runtimeFallback)};

function runtimeCandidates() {
  return [
    process.env.AI_EXPERTS_PROCEDURES_FILE,
    process.env.AI_EXPERTS_PROCEDURE_RUNTIME,
    runtimeFallback,
  ].filter(Boolean);
}

function findRuntime() {
  for (const candidate of runtimeCandidates()) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("Cannot find procedures.js. Set AI_EXPERTS_PROCEDURES_FILE or rerun bootstrap from an installed ai-experts runtime.");
}

function main(argv) {
  const proceduresFile = findRuntime();
  const child = spawnSync(process.execPath, [
    proceduresFile,
    "--procedure-id",
    procedureId,
    "--trigger-skill",
    triggerSkill,
    "--",
    ...argv,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  if (child.error) {
    process.stderr.write(child.error.message + "\\n");
    return 1;
  }
  if (child.status !== 0) {
    process.stderr.write(child.stderr || child.stdout || "procedure runtime failed\\n");
    return child.status ?? 1;
  }
  let payload;
  try {
    payload = JSON.parse(child.stdout);
  } catch {
    process.stderr.write(child.stdout || "procedure runtime returned invalid JSON\\n");
    return 1;
  }
  const result = payload?.result ?? {};
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return Number.isInteger(result.exitCode) ? result.exitCode : (payload?.ok ? 0 : 1);
}

process.exitCode = main(globalThis.process["argv"].slice(2));
`;
}
function currentRuntimeFallback(): string {
  const runtimeRoot = (globalThis as Record<string, unknown>)
    .__aiExpertsRuntimeRoot;
  if (typeof runtimeRoot === "string" && runtimeRoot.length > 0) {
    return path.join(runtimeRoot, "procedures.js");
  }
  return process.env.AI_EXPERTS_PROCEDURES_FILE ?? "";
}
export function plannedBootstrapOutputFiles(
  skillRoot: string,
  targetDir: string,
): string[] {
  const templatesDir = path.join(skillRoot, "assets", "templates");
  const scriptsDir = path.join(targetDir, "scripts");
  return [
    ...Object.keys(SPECKIT_SCRIPT_PROCEDURES).map((scriptName) =>
      path.join(scriptsDir, scriptName),
    ),
    ...collectDirectoryTargets(
      templatesDir,
      path.join(targetDir, "templates"),
    ),
  ];
}
function writeScriptWrappers(
  scriptsDir: string,
  runtimeFallback: string,
): void {
  fs.mkdirSync(scriptsDir, { recursive: true });
  for (const [scriptName, procedureId] of Object.entries(
    SPECKIT_SCRIPT_PROCEDURES,
  )) {
    const scriptPath = path.join(scriptsDir, scriptName);
    fs.writeFileSync(scriptPath, wrapperSource(procedureId, runtimeFallback), {
      encoding: "utf8",
      mode: 0o755,
    });
    fs.chmodSync(scriptPath, 0o755);
  }
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    overwrite: false,
  };
  const positional: any[] = [];
  for (const arg of argv) {
    if (arg === "--overwrite") {
      args.overwrite = true;
    } else {
      positional.push(arg);
    }
  }
  return {
    ...args,
    skillRoot: positional[0] ?? null,
    targetDir: positional[1] ?? null,
  };
}
export function main(argv: readonly string[]): any {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultSkillRoot = path.resolve(scriptDir, "..");
  const repoRoot = getRepoRoot();
  const args = parseArgs(argv);
  const skillRoot = resolveAbsolute(args.skillRoot ?? defaultSkillRoot);
  const targetDir = resolveAbsolute(args.targetDir ?? path.join(repoRoot, ".specify"));
  const templatesDir = path.join(skillRoot, "assets", "templates");
  if (
    !fs.existsSync(templatesDir) ||
    !fs.statSync(templatesDir).isDirectory()
  ) {
    process.stderr.write(
      `[error] Spec Kit 模板资源缺失：${templatesDir} 不存在\n`,
    );
    return 1;
  }
  try {
    for (const outputPath of plannedBootstrapOutputFiles(skillRoot, targetDir)) {
      assertOutputWritable(outputPath, args.overwrite);
    }
    fs.mkdirSync(targetDir, { recursive: true });
    const runtimeFallback = currentRuntimeFallback();
    writeScriptWrappers(path.join(targetDir, "scripts"), runtimeFallback);
    copyDirectoryContents(templatesDir, path.join(targetDir, "templates"));
    process.stdout.write(`[ok] 已初始化 .specify 资源：${targetDir}\n`);
    process.stdout.write(
      `[ok] scripts 已生成：${path.join(targetDir, "scripts")}\n`,
    );
    process.stdout.write(`[ok] templates 来源：${templatesDir}\n`);
    return 0;
  } catch (error: any) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}
