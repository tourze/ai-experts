import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { join } from "path";
import { findUp, JS_LINT_EXTENSIONS, matchExt } from "../_shared/hook-edit-write-utils";
import { getErrorMessage, getErrorStatus, getExecOutput } from "../_shared/error-utils";

export const typescriptLintEslintHook = defineHook({
  id: "typescript-lint-eslint",
  description: "用 ESLint 检查 TypeScript 代码质量问题。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./typescript-lint-eslint.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * ESLint v9 代码检查
 *
 * - 向上查找 eslint.config.{js,mjs,cjs,ts} 确定项目根目录
 * - 无配置或本地 eslint 包未安装时静默跳过
 * - ESLint 仅在发现 error 级别规则违反时 exit 1（warning 不阻断）
 */

const CONFIG_NAMES = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config",
  "eslint.config.cjs",
  "eslint.config.ts",
];

function matches(filePath: string) {
  return matchExt(filePath, JS_LINT_EXTENSIONS);
}

async function check(filePath: string) {
  const projectDir = findUp(filePath, CONFIG_NAMES);
  if (!projectDir) return null;

  const eslintScript = join(projectDir, "node_modules", "eslint", "bin", "eslint.js");
  if (!existsSync(eslintScript)) return null;

  try {
    execFileSync(process.execPath, [eslintScript, "--no-warn-ignored", filePath], {
      stdio: "pipe",
      timeout: 30000,
      cwd: projectDir,
    });
    return null;
  } catch (err: unknown) {
    if (getErrorStatus(err) === 2) return null;
    const output = getExecOutput(err) || getErrorMessage(err);
    return output.trim() ? { lang: "ESLint", message: output } : null;
  }
}

export async function run(payload: NormalizedHookPayload) {
  const filePath = payload?.tool?.input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;
  const result = await check(filePath);
  if (!result) return null;
  return {
    decision: "block",
    reason: `[${result.lang}] ${result.message.trim()}\n\n请修复后再继续。`,
  };
}
