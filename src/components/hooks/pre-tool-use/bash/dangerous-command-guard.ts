import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const dangerousCommandGuardHook = defineHook({
  id: "dangerous-command-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./dangerous-command-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * 破坏性文件系统命令拦截 hook（PreToolUse — Bash）
 *
 * 只拦截语言无关的通用危险操作（rm -rf 等）。
 * Git 破坏性命令由 git hooks 负责，SQL 破坏性命令由 database hooks 负责。
 */

const DANGEROUS_PATTERNS = [
  // rm -r / (根文件系统)
  [/\brm\s+-[A-Za-z]*[rR][A-Za-z]*\s+\/(\s|$|;|&|\|)/, "rm -r / 会删除整个文件系统"],
  // rm -r 顶层目录 (如 /tmp、/home、/Users，但允许 /a/b/c 等深层路径)
  [/\brm\s+-[A-Za-z]*[rR][A-Za-z]*\s+\/[^\/\s]+\/?(\s|$|;|&|\|)/, "rm -r 顶层目录（如 /tmp /home）极其危险"],
  // rm -r ~ (家目录及其子路径)
  [/\brm\s+-[A-Za-z]*[rR][A-Za-z]*\s+~/, "rm -r ~ 家目录极其危险"],
  // rm -r . 或 rm -r ./
  [/\brm\s+-[A-Za-z]*[rR][A-Za-z]*\s+\.\/?(\s|$|;|&|\|)/, "rm -r . 会删除当前目录所有内容"],
];

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  for (const [pattern, reason] of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: `[Dangerous Command] 已拦截高危命令\n\n原因：${reason}\n命令：${command}\n\n如确需执行，请先得到用户明确授权。`,
      };
    }
  }
  return null;
}
