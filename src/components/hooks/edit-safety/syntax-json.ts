import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { readFileSync, existsSync } from "fs";
import { matchExt } from "../_shared/hook-edit-write-utils";
import { getErrorMessage } from "../_shared/error-utils";

export const syntaxJsonHook = defineHook({
  id: "syntax-json",
  description: "检查 JSON 文件语法错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./syntax-json.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

function matches(filePath: string) {
  return matchExt(filePath, [".json"]);
}

async function check(filePath: string) {
  try {
    JSON.parse(readFileSync(filePath, "utf-8"));
    return null;
  } catch (err: unknown) {
    return { lang: "JSON Syntax", message: getErrorMessage(err) };
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
