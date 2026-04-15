/**
 * git-destructive-command-guard（PreToolUse — Bash）
 *
 * 配置化拦截 Git 破坏性命令。新增规则只需在 RULES 中加一条。
 * 使用 shell tokenizer 解析命令，比正则更准确。
 */

import { findGitSubcommandInvocations, hasShortFlag } from "./_shell-utils.mjs";

const BULK_RESTORE_PATHS = new Set([".", "./", "*", "./*"]);

function hasBulkRestoreTarget(args) {
  const idx = args.indexOf("--");
  if (idx === -1 || idx === args.length - 1) return false;
  return args.slice(idx + 1).some((t) => BULK_RESTORE_PATHS.has(t));
}

function hasSourceHead(args) {
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--source" && args[i + 1] === "HEAD") return true;
    if (args[i].startsWith("--source=") && args[i].slice("--source=".length) === "HEAD") return true;
  }
  return false;
}

// ── 规则表：每条 { subcommand, match(args) → bool, reason } ──
const RULES = [
  {
    subcommand: "reset",
    match: (args) => args.includes("--hard"),
    reason: "`git reset --hard` 会丢失工作区与暂存区中的未提交改动",
  },
  {
    subcommand: "checkout",
    match: hasBulkRestoreTarget,
    reason: "`git checkout -- .` 会整体丢弃当前目录下的工作区改动",
  },
  {
    subcommand: "restore",
    match: hasSourceHead,
    reason: "`git restore --source=HEAD` 会用 HEAD 覆盖当前改动",
  },
  {
    subcommand: "clean",
    match: (args) => args.some((a) => hasShortFlag(a, "f") || hasShortFlag(a, "d")),
    reason: "`git clean -f/-d` 会永久删除未跟踪的文件/目录",
  },
  {
    subcommand: "push",
    match: (args) => !args.includes("--force-with-lease") && (args.includes("--force") || args.includes("-f")),
    reason: "`git push --force` 会覆盖远程历史，请改用 --force-with-lease",
  },
  {
    subcommand: "branch",
    match: (args) => args.some((a) => a === "-D" || hasShortFlag(a, "D")),
    reason: "`git branch -D` 会强制删除分支（含未合并的提交）",
  },
  {
    subcommand: "stash",
    match: (args) => args.includes("drop") || args.includes("clear"),
    reason: "`git stash drop/clear` 会永久丢失暂存的改动",
  },
];

export async function run(payload) {
  const command = payload?.tool_input?.command || "";
  if (!/\bgit\b/.test(command)) return null;

  for (const rule of RULES) {
    for (const args of findGitSubcommandInvocations(command, rule.subcommand)) {
      if (rule.match(args)) {
        return {
          decision: "block",
          reason: [
            "[Dangerous Git Command] 已拦截高危命令",
            "",
            `原因：${rule.reason}。`,
            `命令：${command}`,
            "",
            "如确需执行，必须先得到用户明确授权。",
          ].join("\n"),
        };
      }
    }
  }

  return null;
}
