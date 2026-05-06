import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { hasCommand, cmd, matchExt } from "../_shared/hook-edit-write-utils";
import { getExecOutput } from "../_shared/error-utils";

export const pythonSyntaxHook = defineHook({
  id: "python-syntax",
  description: "用 py_compile 检查 Python 文件语法错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./python-syntax.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

function matches(filePath: string) {
  return matchExt(filePath, [".py", ".pyi"]);
}

function findPythonBinary() {
  if (hasCommand("python3")) {
    return "python3";
  }
  if (hasCommand("python")) {
    return "python";
  }
  return null;
}

async function check(filePath: string) {
  const py = findPythonBinary();
  if (!py) return null;
  try {
    execFileSync(cmd(py), ["-m", "py_compile", filePath], { stdio: "pipe", timeout: 15000 });
    return null;
  } catch (err: unknown) {
    const output = getExecOutput(err);
    return output.trim() ? { lang: "Python Syntax", message: output } : null;
  }
}

export async function run(payload: LegacyHookPayload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;
  const result = await check(filePath);
  if (!result) return null;
  return {
    decision: "block",
    reason: `[${result.lang}] ${result.message.trim()}\n\n请修复后再继续。`,
  };
}
