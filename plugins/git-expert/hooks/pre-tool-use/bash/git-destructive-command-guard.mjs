/**
 * git-destructive-command-guard（PreToolUse — Bash）
 *
 * 只拦截 memory/AGENTS.md 中明确点名的 Git 破坏性命令，不扩展到更宽泛的
 * Git 恢复/清理语义，避免把正常修复流也一起阻断。
 */

import { findGitSubcommandInvocations } from "./_shell-utils.mjs";

const BULK_RESTORE_PATHS = new Set([".", "./", "*", "./*"]);

function hasHardReset(args) {
  return args.includes("--hard");
}

function isBulkCheckoutRestore(args) {
  const markerIndex = args.indexOf("--");
  if (markerIndex === -1 || markerIndex === args.length - 1) return false;

  return args.slice(markerIndex + 1).some((token) => BULK_RESTORE_PATHS.has(token));
}

function hasSourceHead(args) {
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (token === "--source" && args[i + 1] === "HEAD") return true;
    if (token.startsWith("--source=") && token.slice("--source=".length) === "HEAD") {
      return true;
    }
  }

  return false;
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  if (!/\bgit\b/.test(command)) return null;

  for (const args of findGitSubcommandInvocations(command, "reset")) {
    if (hasHardReset(args)) {
      return {
        decision: "block",
        reason: [
          "[Dangerous Git Command] 已拦截高危命令",
          "",
          "原因：`git reset --hard` 会丢失工作区与暂存区中的未提交改动。",
          `命令：${command}`,
          "",
          "如确需执行，必须先得到用户明确授权。",
        ].join("\n"),
      };
    }
  }

  for (const args of findGitSubcommandInvocations(command, "checkout")) {
    if (isBulkCheckoutRestore(args)) {
      return {
        decision: "block",
        reason: [
          "[Dangerous Git Command] 已拦截高危命令",
          "",
          "原因：`git checkout -- .` 会整体丢弃当前目录下的工作区改动。",
          `命令：${command}`,
          "",
          "如确需执行，必须先得到用户明确授权。",
        ].join("\n"),
      };
    }
  }

  for (const args of findGitSubcommandInvocations(command, "restore")) {
    if (hasSourceHead(args)) {
      return {
        decision: "block",
        reason: [
          "[Dangerous Git Command] 已拦截高危命令",
          "",
          "原因：`git restore --source=HEAD` 会用 HEAD 覆盖当前改动。",
          `命令：${command}`,
          "",
          "如确需执行，必须先得到用户明确授权。",
        ].join("\n"),
      };
    }
  }

  return null;
}
