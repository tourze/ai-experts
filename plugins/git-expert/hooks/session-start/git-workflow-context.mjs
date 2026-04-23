/**
 * git-workflow-context（SessionStart）
 *
 * 在会话起手阶段注入 Git 协作纪律，降低重复探测与误提交流程的概率。
 * 这段提示来自原记忆文件中适合 hook 化的 Git 规则：
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
      "<SUBAGENT-STOP>",
      "如果你是被派遣执行特定任务的 subagent，跳过本段上下文，直接执行你的任务。",
      "</SUBAGENT-STOP>",
      "",
      "📌 Git 工作流",
      "",
      "1. 默认按共享工作区处理，除非你确认在 `git worktree` 隔离目录。",
      "2. 开工前先看 `git status --short`，必要时看 `git diff --stat` / `git diff`。",
      "3. 提交前先看 `git diff --cached --stat` 与 `git diff --cached`。",
      "4. `git reset --hard` 等破坏命令默认禁止，需用户明确授权。",
      "5. `git commit -m` 禁止 heredoc，多段说明用多个 `-m`。",
      "",
      "详细规范以全局记忆文件为准。",
    ].join("\n"),
  };
}
