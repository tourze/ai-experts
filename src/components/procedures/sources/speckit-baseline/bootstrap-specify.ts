#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRepoRoot } from './common';
const SPECKIT_SCRIPT_PROCEDURES: Record<string, string> = {
    'check-prerequisites.mjs': 'speckit-baseline-check-prerequisites',
    'create-new-feature.mjs': 'speckit-baseline-create-new-feature',
    'setup-plan.mjs': 'speckit-baseline-setup-plan'
};
function resolveAbsolute(targetPath: any): any {
    if (!targetPath) {
        return '';
    }
    return path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath);
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
function shellQuote(value: string): string {
    return JSON.stringify(value);
}
function wrapperSource(procedureId: string, runtimeFallback: string): string {
    return `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const procedureId = ${shellQuote(procedureId)};
const triggerSkill = "speckit-baseline";
const runtimeFallback = ${shellQuote(runtimeFallback)};

function runtimeCandidates() {
  return [
    process.env.AI_EXPERTS_PROCEDURES_FILE,
    process.env.AI_EXPERTS_PROCEDURE_RUNTIME,
    join(homedir(), ".claude", "procedures.js"),
    join(homedir(), ".codex", "procedures.js"),
    runtimeFallback,
  ].filter(Boolean);
}

function findRuntime() {
  for (const candidate of runtimeCandidates()) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("Cannot find procedures.js. Set AI_EXPERTS_PROCEDURES_FILE or install ai-experts for Claude/Codex.");
}

function main(argv = process.argv.slice(2)) {
  const proceduresFile = findRuntime();
  const child = spawnSync(process.execPath, [
    proceduresFile,
    "--procedure-id",
    procedureId,
    "--trigger-skill",
    triggerSkill,
    "--request-json",
    JSON.stringify({ args: argv }),
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

process.exitCode = main();
`;
}
function writeScriptWrappers(scriptsDir: string, runtimeFallback: string): void {
    fs.mkdirSync(scriptsDir, { recursive: true });
    for (const [scriptName, procedureId] of Object.entries(SPECKIT_SCRIPT_PROCEDURES)) {
        const scriptPath = path.join(scriptsDir, scriptName);
        fs.writeFileSync(scriptPath, wrapperSource(procedureId, runtimeFallback), { encoding: 'utf8', mode: 0o755 });
        fs.chmodSync(scriptPath, 0o755);
    }
}
export function main(argv: any = process.argv.slice(2)): any {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const defaultPluginDir = path.resolve(scriptDir, '..');
    const repoRoot = getRepoRoot();
    const pluginDir = resolveAbsolute(argv[0] ?? defaultPluginDir);
    const targetDir = resolveAbsolute(argv[1] ?? path.join(repoRoot, '.specify'));
    const templatesDir = path.join(pluginDir, 'templates');
    if (!fs.existsSync(templatesDir) || !fs.statSync(templatesDir).isDirectory()) {
        process.stderr.write(`[error] Spec Kit 模板资源缺失：${templatesDir} 不存在\n`);
        return 1;
    }
    fs.mkdirSync(targetDir, { recursive: true });
    const runtimeFallback = process.env.AI_EXPERTS_PROCEDURES_FILE ?? '';
    writeScriptWrappers(path.join(targetDir, 'scripts'), runtimeFallback);
    copyDirectoryContents(templatesDir, path.join(targetDir, 'templates'));
    process.stdout.write(`[ok] 已初始化 .specify 资源：${targetDir}\n`);
    process.stdout.write(`[ok] scripts 已生成：${path.join(targetDir, 'scripts')}\n`);
    process.stdout.write(`[ok] templates 来源：${templatesDir}\n`);
    return 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main();
}
