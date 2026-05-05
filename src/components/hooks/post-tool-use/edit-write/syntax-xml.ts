import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, matchExt } from "./_utils.mjs";

export const syntaxXmlHook = defineHook({
  id: "syntax-xml",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./syntax-xml.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

function matches(filePath) {
  return matchExt(filePath, [".xml", ".xsl", ".xsd"]);
}

async function check(filePath) {
  if (process.platform === "win32") return null;
  if (!hasCommand("xmllint")) return null;
  try {
    execFileSync("xmllint", ["--noout", filePath], { stdio: "pipe", timeout: 15000 });
    return null;
  } catch (err) {
    const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() ? { lang: "XML Syntax", message: output } : null;
  }
}


export async function run(payload) {
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
