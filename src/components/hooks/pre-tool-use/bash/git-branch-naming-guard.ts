import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { findGitSubcommandInvocations } from "../../_shared/hook-bash-git-shell-utils";

export const gitBranchNamingGuardHook = defineHook({
  id: "git-branch-naming-guard",
  description: "强制新建分支遵循 <type>/<slug> 命名规范。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-branch-naming-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * 分支命名守卫 hook（PreToolUse — Bash）
 *
 * 强制新建分支遵循 <type>/<slug> 命名规范，与 commit-message-guard 的
 * Conventional Commits type 清单保持一致。
 *
 * 触发命令：
 *   git checkout -b <name> [start-point]
 *   git checkout -B <name> [start-point]
 *   git switch -c <name> [start-point]
 *   git switch -C <name> [start-point]
 *   git switch --create <name> [start-point]
 *   git switch --force-create <name> [start-point]
 *
 * 不触发：
 *   git checkout <existing>    （切换）
 *   git branch                  （列表 / 删除 / 重命名）
 *   git switch <existing>       （切换）
 *
 * 替代原 branch-naming-helper skill，改为自动化零干预。
 */


// 与 commit-message-guard 共用同一套 type 清单
const ALLOWED_TYPES = [
  "feat", "fix", "docs", "style", "refactor",
  "perf", "test", "build", "ci", "chore", "revert",
];

// <type>/<slug>：slug 允许小写字母/数字开头，后续可含 . _ - /，总长 2-80
const NAME_PATTERN = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})/[a-z0-9][a-z0-9._\\-/]{1,79}$`
);

function validateName(name) {
  if (NAME_PATTERN.test(name)) return null;

  const hints = [];
  if (!name.includes("/")) {
    hints.push(`缺少 type 前缀，应为 <type>/<slug> 形式`);
  } else {
    const type = name.split("/", 1)[0];
    if (!ALLOWED_TYPES.includes(type)) {
      hints.push(`type "${type}" 不在允许列表内`);
    }
  }
  if (/[A-Z]/.test(name)) hints.push("含大写字母，请使用全小写");
  if (/\s/.test(name)) hints.push("含空格");
  if (/[^a-zA-Z0-9._\-/]/.test(name)) {
    hints.push("含非法字符（仅允许字母/数字/. _ - /）");
  }

  return hints.length > 0
    ? hints.join("；")
    : "不符合 <type>/<slug> 命名规范";
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  // 快速短路
  if (!/\bgit\b/.test(command)) return null;

  const candidates = [];
  for (const args of findGitSubcommandInvocations(command, "checkout")) {
    if ((args[0] === "-b" || args[0] === "-B") && args[1]) {
      candidates.push(args[1]);
    }
  }
  for (const args of findGitSubcommandInvocations(command, "switch")) {
    if (["-c", "-C", "--create", "--force-create"].includes(args[0]) && args[1]) {
      candidates.push(args[1]);
    }
  }

  for (const name of candidates) {
    const problem = validateName(name);
    if (!problem) return null;

    return {
      decision: "block",
      reason: [
        `[Branch Naming] 已拦截不合规的分支创建命令`,
        ``,
        `命令: ${command}`,
        `分支名: ${name}`,
        `问题: ${problem}`,
        ``,
        `要求: <type>/<slug>`,
        `  允许的 type: ${ALLOWED_TYPES.join(", ")}`,
        `  slug: 小写字母/数字开头，仅含 a-z 0-9 . _ - /`,
        ``,
        `示例:`,
        `  feat/oauth-login`,
        `  fix/commit-guard-regex`,
        `  refactor/hooks-dispatch`,
        `  chore/deps-bump-2026-04`,
      ].join("\n"),
    };
  }

  return null;
}
