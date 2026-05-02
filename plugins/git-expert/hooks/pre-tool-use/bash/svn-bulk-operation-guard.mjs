/**
 * SVN 批量操作守卫 hook（PreToolUse — Bash）
 *
 * 拦截 `svn add .`、`svn add --force`、`svn commit`（无路径）等高风险命令，
 * 强制使用显式路径，防止多进程协作时混入无关改动。
 */

import { findSvnSubcommandInvocations } from "./_shell-utils.mjs";

const BULK_ADD_PATHS = new Map([
  [".", "svn add . 会添加当前目录下所有未版本化文件"],
  ["./", "svn add ./ 会添加当前目录下所有未版本化文件"],
  ["*", "svn add * 会添加所有匹配文件"],
  ["./*", "svn add ./* 会添加所有匹配文件"],
]);

const ADD_OPTIONS_WITH_VALUE = new Set([
  "--changelist",
  "--config-dir",
  "--config-option",
  "--depth",
  "--native-eol",
  "--password",
  "--targets",
  "--username",
]);

const COMMIT_OPTIONS_WITH_VALUE = new Set([
  "-F",
  "-m",
  "-r",
  "--changelist",
  "--cl",
  "--config-dir",
  "--config-option",
  "--depth",
  "--editor-cmd",
  "--encoding",
  "--extensions",
  "--file",
  "--message",
  "--password",
  "--revision",
  "--targets",
  "--username",
  "--with-revprop",
]);

const INLINE_VALUE_PREFIXES = [
  "--changelist=",
  "--cl=",
  "--config-dir=",
  "--config-option=",
  "--depth=",
  "--editor-cmd=",
  "--encoding=",
  "--extensions=",
  "--file=",
  "--message=",
  "--native-eol=",
  "--password=",
  "--revision=",
  "--targets=",
  "--username=",
  "--with-revprop=",
];

function isInlineValueOption(token) {
  return INLINE_VALUE_PREFIXES.some((prefix) => token.startsWith(prefix));
}

function inspectAddArgs(args) {
  let afterDoubleDash = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (afterDoubleDash) {
      if (BULK_ADD_PATHS.has(token)) return BULK_ADD_PATHS.get(token);
      continue;
    }

    if (token === "--") {
      afterDoubleDash = true;
      continue;
    }

    if (token === "--targets" || token.startsWith("--targets=")) {
      return "svn add --targets 会从文件中批量读取路径，容易混入无关改动";
    }

    if (token === "--force") {
      return "svn add --force 会递归扫描并批量添加未纳管文件";
    }

    if (ADD_OPTIONS_WITH_VALUE.has(token)) {
      i += 1;
      continue;
    }

    if (token.startsWith("-F") || token.startsWith("-m") || token.startsWith("-r")) {
      continue;
    }

    if (isInlineValueOption(token) || token.startsWith("-")) {
      continue;
    }

    if (BULK_ADD_PATHS.has(token)) return BULK_ADD_PATHS.get(token);
  }

  return null;
}

function inspectCommitArgs(args) {
  let afterDoubleDash = false;
  let hasExplicitPath = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (afterDoubleDash) {
      if (token) hasExplicitPath = true;
      continue;
    }

    if (token === "--") {
      afterDoubleDash = true;
      continue;
    }

    if (token === "--targets" || token.startsWith("--targets=")) {
      return "svn commit --targets 会从文件中批量读取路径，提交范围不透明";
    }

    if (COMMIT_OPTIONS_WITH_VALUE.has(token)) {
      i += 1;
      continue;
    }

    if (token.startsWith("-m") || token.startsWith("-F") || token.startsWith("-r")) {
      continue;
    }

    if (isInlineValueOption(token) || token.startsWith("-")) {
      continue;
    }

    hasExplicitPath = true;
  }

  if (!hasExplicitPath) {
    return "svn commit 未指定具体路径时会提交工作副本中的整批修改";
  }

  return null;
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  for (const args of findSvnSubcommandInvocations(command, "add")) {
    const reason = inspectAddArgs(args);
    if (reason) {
      return {
        decision: "block",
        reason: `[SVN Add Guard] 已拦截批量添加命令\n\n原因：${reason}\n命令：${command}\n\n请使用 svn add <具体文件路径> 逐个添加，确保只纳管当前任务相关文件。`,
      };
    }
  }

  for (const args of findSvnSubcommandInvocations(command, "commit")) {
    const reason = inspectCommitArgs(args);
    if (reason) {
      return {
        decision: "block",
        reason: [
          "[SVN Commit Guard] 已拦截高风险提交命令",
          "",
          `命令：${command}`,
          "",
          `原因：${reason}`,
          "请使用 svn commit <具体文件路径> -m \"提交信息\" 明确指定提交范围。",
        ].join("\n"),
      };
    }
  }

  return null;
}
