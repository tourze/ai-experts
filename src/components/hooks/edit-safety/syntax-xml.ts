import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, matchExt } from "../_shared/hook-edit-write-utils";
import { getExecOutput } from "../_shared/error-utils";

export const syntaxXmlHook = defineHook({
  id: "syntax-xml",
  description: "用 xmllint 检查 XML 文件语法错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./syntax-xml.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

function matches(filePath: string) {
  return matchExt(filePath, [".xml", ".xsl", ".xsd"]);
}

async function check(filePath: string) {
  if (process.platform === "win32") return null;
  if (!hasCommand("xmllint")) return null;
  try {
    execFileSync("xmllint", ["--noout", filePath], { stdio: "pipe", timeout: 15000 });
    return null;
  } catch (err: unknown) {
    const output = getExecOutput(err);
    return output.trim() ? { lang: "XML Syntax", message: output } : null;
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
