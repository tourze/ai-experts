import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchExt, findUp } from "../_shared/hook-edit-write-utils";
import { getErrorStatus, getExecOutput } from "../_shared/error-utils";

export const pythonLintRuffHook = defineHook({
  id: "python-lint-ruff",
  description: "用 Ruff 检查 Python 代码风格和错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./python-lint-ruff.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * Ruff Python 代码检查（替代 python-code-style + python-anti-patterns skill）
 *
 * - 向上查找 pyproject.toml / ruff.toml / .ruff.toml 确定项目根目录
 * - 无配置时仍可运行（ruff 有合理默认值）
 * - ruff 未安装时静默跳过
 * - 仅在发现 error 级别违反时 block
 */

const CONFIG_NAMES = [
  "ruff.toml",
  ".ruff.toml",
  "pyproject.toml",
];
const EXTS = [".py", ".pyi"];

function matches(filePath: string) {
  return matchExt(filePath, EXTS);
}

async function check(filePath: string) {
  if (!hasCommand("ruff")) return null;

  const projectDir = findUp(filePath, CONFIG_NAMES);
  const args = [
    "check",
    "--output-format=concise",
    "--no-fix",
    filePath,
  ];

  try {
    execFileSync(cmd("ruff"), args, {
      stdio: "pipe",
      timeout: 15000,
      cwd: projectDir || undefined,
    });
    return null;
  } catch (err: unknown) {
    // exit 2 = 配置/内部错误，不阻断用户
    if (getErrorStatus(err) === 2) return null;
    const output = getExecOutput(err);
    return output.trim() ? { lang: "Ruff", message: output } : null;
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
