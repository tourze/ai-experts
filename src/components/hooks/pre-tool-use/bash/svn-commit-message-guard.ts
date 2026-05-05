import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { readFileSync } from "fs";
import { resolve } from "path";
import { extractCommandCwd, findSvnSubcommandInvocations } from "./git-_shell-utils.mjs";

export const svnCommitMessageGuardHook = defineHook({
  id: "svn-commit-message-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./svn-commit-message-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * SVN 提交信息质量守门 hook（PreToolUse — Bash）
 *
 * 规则：
 * 1. 拦截明显模糊的提交信息
 * 2. 拦截过短的提交信息
 * 3. 未使用 Conventional Commits 时给出 report 提示
 */


const CC_TYPES = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"];
const CC_PATTERN = new RegExp(`^(${CC_TYPES.join("|")})(\\([^)]+\\))?!?:\\s.+`);
const COMMIT_OPTIONS_WITH_VALUE = new Set([
  "-r",
  "--changelist",
  "--cl",
  "--config-dir",
  "--config-option",
  "--depth",
  "--editor-cmd",
  "--encoding",
  "--extensions",
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
  "--password=",
  "--revision=",
  "--targets=",
  "--username=",
  "--with-revprop=",
];

function isInlineValueOption(token) {
  return INLINE_VALUE_PREFIXES.some((prefix) => token.startsWith(prefix));
}

function readMessageFromFile(filePath, cwd) {
  if (!filePath || filePath === "-" || filePath === "/dev/stdin") return null;

  try {
    return readFileSync(resolve(cwd, filePath), "utf-8");
  } catch {
    return null;
  }
}

function extractCommitMessage(command, cwd) {
  const paragraphs = [];

  for (const args of findSvnSubcommandInvocations(command, "commit")) {
    for (let i = 0; i < args.length; i += 1) {
      const token = args[i];

      if (token === "--") break;

      if (token === "-m" || token === "--message") {
        if (args[i + 1]) paragraphs.push(args[++i]);
        continue;
      }

      if (token.startsWith("--message=")) {
        paragraphs.push(token.slice("--message=".length));
        continue;
      }

      if (token === "-F" || token === "--file") {
        const content = readMessageFromFile(args[i + 1], cwd);
        if (content) paragraphs.push(content);
        i += 1;
        continue;
      }

      if (token.startsWith("--file=")) {
        const content = readMessageFromFile(token.slice("--file=".length), cwd);
        if (content) paragraphs.push(content);
        continue;
      }

      if (token.startsWith("-m") && token !== "-m") {
        paragraphs.push(token.slice(2));
        continue;
      }

      if (token.startsWith("-F") && token !== "-F") {
        const content = readMessageFromFile(token.slice(2), cwd);
        if (content) paragraphs.push(content);
        continue;
      }

      if (COMMIT_OPTIONS_WITH_VALUE.has(token)) {
        i += 1;
        continue;
      }

      if (token.startsWith("-r") && token !== "-r") {
        continue;
      }

      if (isInlineValueOption(token) || token.startsWith("-")) {
        continue;
      }
    }
  }

  return paragraphs.join("\n\n").trim();
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  if (!/\bsvn\s+(commit|ci)\b/.test(command)) return null;

  const cwd = extractCommandCwd(command, payload?.cwd || process.cwd());
  const message = extractCommitMessage(command, cwd);
  if (!message) return null;

  const firstLine = message
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) || "";
  const errors = [];

  if (/^(fix|update|完善|修复|优化|调整|兼容|补充|紧急修改|修改)\s*$/i.test(firstLine)) {
    errors.push("提交信息过于模糊，必须说明：修了什么、改了什么、为什么改");
  }

  if (firstLine.length < 8) {
    errors.push(`提交信息首行仅 ${firstLine.length} 字符，过短，无法传达有效信息`);
  }

  if (errors.length === 0 && !CC_PATTERN.test(firstLine)) {
    return {
      decision: "report",
      reason: [
        "[SVN Commit Message] 建议使用 Conventional Commits 格式：",
        "  <type>(<scope>): <description>",
        `  允许的 type: ${CC_TYPES.join(", ")}`,
        "  示例: feat(auth): 添加 OAuth2 登录支持",
        "",
        `当前 message: "${firstLine}"`,
      ].join("\n"),
    };
  }

  if (errors.length > 0) {
    return {
      decision: "block",
      reason: `[SVN Commit Message] 提交信息质量不达标：\n\n${errors.map((entry) => `• ${entry}`).join("\n")}\n\n当前 message: "${firstLine}"\n\n请补充具体的改动说明后重新提交。`,
    };
  }

  return null;
}
