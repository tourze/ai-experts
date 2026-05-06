import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchName } from "../_shared/hook-edit-write-utils";
import { dirname } from "path";
import { getExecOutput } from "../_shared/error-utils";

export const phpSyntaxComposerHook = defineHook({
  id: "php-syntax-composer",
  description: "用 composer validate 检查 composer.json 合法性。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./php-syntax-composer.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

function matches(filePath: string) {
  return matchName(filePath, ["composer.json"]);
}

async function check(filePath: string) {
  if (!hasCommand("composer")) return null;
  const cwd = dirname(filePath);
  try {
    execFileSync(cmd("composer"), ["validate", "--no-check-publish", "--no-check-lock", "--strict"], {
      stdio: "pipe",
      timeout: 30000,
      cwd,
    });
    return null;
  } catch (err: unknown) {
    const output = getExecOutput(err);
    // 过滤掉纯 warning（如 lock 文件过期），只关注 error
    if (output.includes("is valid") && !output.includes("error")) return null;
    return output.trim() ? { lang: "Composer Validate", message: output } : null;
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
