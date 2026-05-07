import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { findGitSubcommandInvocations, hasShortFlag } from "../_shared/hook-bash-git-shell-utils";

export const gitAddGuardHook = defineHook({
  id: "git-add-guard",
  description: "拦截 git add -A / . 等批量暂存，强制逐文件 staged。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./git-add-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * Git Add 范围守卫 hook（PreToolUse — Bash）
 *
 * 禁止无路径的 git add -A / git add --all / git add -u 以及
 * git add . / git add * 这类批量暂存命令，强制使用
 * git add <具体文件> 逐个暂存，防止多进程协作时混入无关改动。
 */


const BULK_PATHS = new Map([
  [".", "git add . 会暂存当前目录下所有改动"],
  ["./", "git add ./ 会暂存当前目录下所有改动"],
  ["*", "git add * 会暂存所有匹配文件"],
  ["./*", "git add ./* 会暂存所有匹配文件"],
]);

const OPTION_VALUE_FLAGS = new Set(["--chmod"]);

function inspectArgs(args: readonly string[]) {
  let hasBulkMode = false;
  let hasExplicitPathspec = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (token === "--") continue;

    if (token === "--pathspec-from-file" || token.startsWith("--pathspec-from-file=")) {
      return "git add --pathspec-from-file 可一次性暂存大量文件，容易混入无关改动";
    }

    if (OPTION_VALUE_FLAGS.has(token)) {
      i += 1;
      continue;
    }

    if (token === "-A" || token === "--all" || token === "-u" || token === "--update") {
      hasBulkMode = true;
      continue;
    }

    if (hasShortFlag(token, "A") || hasShortFlag(token, "u")) {
      hasBulkMode = true;
      continue;
    }

    if (BULK_PATHS.has(token)) {
      return BULK_PATHS.get(token);
    }

    if (!token.startsWith("-")) {
      hasExplicitPathspec = true;
    }
  }

  if (hasBulkMode && !hasExplicitPathspec) {
    return "git add -A/--all/-u 在未指定具体路径时会暂存整批改动";
  }

  return null;
}

export async function run(payload: NormalizedHookPayload) {
  const command = payload?.tool?.input?.command || "";

  // 只对含 git add 的命令生效
  if (!/\bgit\s+add\b/.test(command)) return null;

  for (const args of findGitSubcommandInvocations(command, "add")) {
    const reason = inspectArgs(args);
    if (reason) {
      return {
        decision: "block",
        reason: `[Git Add Guard] 已拦截批量暂存命令\n\n原因：${reason}\n命令：${command}\n\n多进程协作环境下，请使用 git add <具体文件路径> 逐个暂存，确保只提交当前任务相关的文件。`,
      };
    }
  }
  return null;
}
