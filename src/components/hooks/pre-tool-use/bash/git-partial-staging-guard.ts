import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { execFileSync } from "child_process";
import { extractCommandCwd } from "./git-_shell-utils.mjs";

export const gitPartialStagingGuardHook = defineHook({
  id: "git-partial-staging-guard",
  description: "检测同一文件同时存在 staged 与 unstaged 改动，防止部分提交遗漏。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-partial-staging-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * partial-staging-guard（PreToolUse — Bash）
 *
 * 在 `git commit` 前检查是否存在“同一文件同时有 staged 与 unstaged 改动”。
 * 这通常意味着只提交了部分 hunk；在多进程协作或共享工作区里，
 * 剩余未暂存部分很可能属于其他任务或其他 Agent 的现场。
 *
 * 仅 report，不 block：
 *   - `git add -p` 的部分暂存本身可能是有意为之
 *   - 这里的目标是提醒二次确认边界，而不是阻断合法工作流
 */


function gitNameOnly(args, cwd) {
  try {
    const output = execFileSync("git", args, {
      cwd,
      encoding: "utf-8",
      timeout: 10_000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return output ? output.split("\n").filter(Boolean) : [];
  } catch {
    return null;
  }
}

function isCommitAll(command) {
  return /\s--all\b|\s-[a-z]*a[a-z]*(?:\s|$)/.test(` ${command}`);
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";
  if (!/\bgit\s+commit\b/.test(command)) return null;
  if (/--amend\b|--fixup\b|--squash\b/.test(command)) return null;
  if (isCommitAll(command)) return null;

  const cwd = extractCommandCwd(command, payload?.cwd || process.cwd());
  const staged = gitNameOnly(["diff", "--cached", "--name-only"], cwd);
  const unstaged = gitNameOnly(["diff", "--name-only"], cwd);

  if (!staged || !unstaged || staged.length === 0 || unstaged.length === 0) return null;

  const unstagedSet = new Set(unstaged);
  const overlap = staged.filter((file) => unstagedSet.has(file));
  if (overlap.length === 0) return null;

  const preview = overlap.slice(0, 8);
  const remainder = overlap.length - preview.length;

  return {
    decision: "report",
    reason: [
      `[Partial Staging] 检测到 ${overlap.length} 个文件同时存在 staged 与 unstaged 改动：`,
      "",
      ...preview.map((file) => `• ${file}`),
      ...(remainder > 0 ? [`• ... 另 ${remainder} 个文件`] : []),
      "",
      "多进程协作环境下，这通常意味着同一文件只提交了部分 hunk。",
      "请确认剩余未暂存改动不是其他任务或其他进程留下的现场。",
      "提交前建议分别查看 `git diff --cached -- <file>` 与 `git diff -- <file>`。",
    ].join("\n"),
  };
}
