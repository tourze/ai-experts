import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchExt } from "../_shared/hook-edit-write-utils";
import { getExecOutput } from "../_shared/error-utils";

export const phpSyntaxHook = defineHook({
  id: "php-syntax",
  description: "用 php -l 检查 PHP 文件语法错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./php-syntax.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

function matches(filePath: string) {
  return matchExt(filePath, [".php"]);
}

async function check(filePath: string) {
  if (!hasCommand("php")) return null;
  try {
    execFileSync(cmd("php"), ["-l", filePath], { stdio: "pipe", timeout: 15000 });
    return null;
  } catch (err: unknown) {
    const output = getExecOutput(err);
    return output.trim() ? { lang: "PHP Syntax", message: output } : null;
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
