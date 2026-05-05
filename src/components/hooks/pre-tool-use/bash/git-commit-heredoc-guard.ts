import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

export const gitCommitHeredocGuardHook = defineHook({
  id: "git-commit-heredoc-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-commit-heredoc-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * git-commit-heredoc-guard（PreToolUse — Bash）
 *
 * 拦截 `git commit -m "$(cat <<'EOF' ... EOF)"` 这类 heredoc 提交信息写法。
 * 该形式可读性差，且 hook 难以稳定抽取 message；统一要求直接传 `-m` 字符串，
 * 需要 commit body 时使用多个 `-m` 参数。
 */

const HEREDOC_COMMIT_PATTERN = /\bgit\s+commit\b[\s\S]*\$\(\s*cat\s+<</;

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  if (!HEREDOC_COMMIT_PATTERN.test(command)) return null;

  return {
    decision: "block",
    reason: [
      "[Git Commit Message] 已拦截 heredoc 提交信息写法",
      "",
      "原因：`git commit -m` 必须直接传入字符串，不能使用 `$(cat <<'EOF' ... EOF)` 形式。",
      "原因细化：这种写法会降低可读性，也会让 hook 对提交信息的解析与审计变得不稳定。",
      "需要多段说明时，请使用多个 `-m` 参数。",
      "",
      "请改用：",
      "  git commit -m \"feat(scope): 简明首行\"",
      "  git commit -m \"feat(scope): 简明首行\" -m \"补充说明第一段\" -m \"补充说明第二段\"",
      "",
      `命令：${command}`,
    ].join("\n"),
  };
}
