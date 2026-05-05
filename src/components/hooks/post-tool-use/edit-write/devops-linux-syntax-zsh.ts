import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchExt } from "./devops-linux-_utils.mjs";

export const devopsLinuxSyntaxZshHook = defineHook({
  id: "devops-linux-syntax-zsh",
  description: "用 zsh -n 检查 Zsh 脚本语法错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./devops-linux-syntax-zsh.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

function matches(filePath) {
  return matchExt(filePath, [".zsh"]);
}

async function check(filePath) {
  if (!hasCommand("zsh")) return null;
  try {
    execFileSync(cmd("zsh"), ["-n", filePath], { stdio: "pipe", timeout: 15000 });
    return null;
  } catch (err) {
    const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() ? { lang: "Zsh Syntax", message: output } : null;
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
