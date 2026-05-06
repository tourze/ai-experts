import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { cmd, matchExt } from "../_shared/hook-edit-write-utils";
import { getExecOutput } from "../_shared/error-utils";

export const javascriptSyntaxHook = defineHook({
  id: "javascript-syntax",
  description: "用 node --check 检查 JavaScript 语法错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./javascript-syntax.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

function matches(filePath: string) {
  return matchExt(filePath, [".js", ".cjs", ".mjs"]);
}

async function check(filePath: string) {
  try {
    execFileSync(cmd("node"), ["--check", filePath], { stdio: "pipe", timeout: 15000 });
    return null;
  } catch (err: unknown) {
    const output = getExecOutput(err);
    return output.trim() ? { lang: "JavaScript Syntax", message: output } : null;
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
