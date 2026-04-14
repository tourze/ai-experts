/**
 * git-workflow-context（SessionStart）
 *
 * 在会话起手阶段注入 Git 协作纪律，降低重复探测与误提交流程的概率。
 * 这段提示来自原 memory/AGENTS.md 中适合 hook 化的 Git 规则：
 *   - 开工前先看工作区现状
 *   - 提交前先审 staged diff
 *   - 破坏性 Git 命令由 PreToolUse 守卫拦截
 */

import { execFileSync } from "child_process";

function isGitWorktree(cwd) {
  if (typeof cwd !== "string" || !cwd) return false;

  try {
    return execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2_000,
    }).trim() === "true";
  } catch {
    return false;
  }
}

export async function run(payload) {
  if (!isGitWorktree(payload?.cwd)) return null;

  return {
    decision: "context",
    reason: [
      "📌 Git 工作流",
      "",
      "命中 `git-expert` 时，默认遵守以下起手纪律：",
      "",
      "1. 开工前先确认当前仓库状态。",
      "   优先看 `git status --short`；需要判断影响范围时继续看 `git diff --stat` / `git diff`。",
      "   目的：先识别当前任务之外的已有改动，再决定是否动手。",
      "",
      "2. 提交前先审 staged diff。",
      "   在 `git commit` 前先看 `git diff --cached --stat` 与 `git diff --cached`，",
      "   确认 staged 内容只包含当前任务相关变更。",
      "",
      "3. 破坏性 Git 操作默认禁止。",
      "   `git reset --hard`、`git checkout -- .`、`git restore --source=HEAD`",
      "   这类命令会由 PreToolUse hook 直接拦截；如确需执行，必须先得到用户明确授权。",
      "",
      "4. 提交信息不要使用 heredoc。",
      "   `git commit -m` 必须直接传字符串；多段说明请使用多个 `-m` 参数。",
    ].join("\n"),
  };
}
