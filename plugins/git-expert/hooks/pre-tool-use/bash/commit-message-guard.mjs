/**
 * 提交信息质量守门 hook（PreToolUse — Bash）
 *
 * 拦截 git commit 命令，强制执行：
 * 1. Conventional Commits 格式（type(scope): description）
 * 2. 禁止模糊/过短信息
 * 3. 禁止乱码字符（替换符、Latin-1 误解码、控制字符、私用区等）
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { extractCommandCwd, findGitSubcommandInvocations, hasShortFlag } from "./_shell-utils.mjs";

const CC_TYPES = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"];

// 乱码检测：Unicode 替换符、控制字符（排除 \t \n \r）、Latin-1 误解码特征、私用区
// Latin-1 误解码典型特征：UTF-8 被当作 Latin-1 解读后产生 Ã 打头的双字节垃圾
const GARBLED_PATTERN = /\uFFFD|[\x00-\x08\x0E-\x1F\x7F]|[\uE000-\uF8FF]|\u00C3[\u0080-\u00BF]/;
const CC_PATTERN = new RegExp(
  `^(${CC_TYPES.join("|")})(\\([^)]+\\))?!?:\\s.+`
);
const GENERIC_DESCRIPTION_PATTERN = /^(fix|update|move|迁移|修复|优化|调整|兼容|补充|完善|修改|cleanup|clean up|refactor|misc|stuff)$/i;

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

  for (const args of findGitSubcommandInvocations(command, "commit")) {
    for (let i = 0; i < args.length; i += 1) {
      const token = args[i];

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

      if (hasShortFlag(token, "m")) {
        const inline = token.slice(token.indexOf("m") + 1);
        if (inline) {
          paragraphs.push(inline);
        } else if (args[i + 1]) {
          paragraphs.push(args[++i]);
        }
        continue;
      }

      if (hasShortFlag(token, "F")) {
        const inline = token.slice(token.indexOf("F") + 1);
        const content = readMessageFromFile(inline || args[i + 1], cwd);
        if (content) paragraphs.push(content);
        if (!inline) i += 1;
      }
    }
  }

  return paragraphs.join("\n\n").trim();
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  // 只对 git commit 命令生效
  if (!/\bgit\s+commit\b/.test(command)) return null;

  const cwd = extractCommandCwd(command, payload?.cwd || process.cwd());
  const message = extractCommitMessage(command, cwd);

  if (!message) return null;

  const firstLine = message
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) || "";
  const description = (firstLine.match(/^[^:]+:\s*(.+)$/)?.[1] || firstLine).trim();
  const errors = [];

  // 1. 禁止纯 "fix"、"update"、"move"、"迁移" 等模糊描述
  if (GENERIC_DESCRIPTION_PATTERN.test(description) || /^(紧急修改|ecf)\s*$/i.test(firstLine)) {
    errors.push("提交描述过于模糊，必须说明具体改了什么、范围在哪里、为什么要改");
  }

  // 2. 首行长度检查
  if (firstLine.length < 8) {
    errors.push(`首行仅 ${firstLine.length} 字符，过短，无法传达有效信息`);
  }

  // 3. 乱码字符检测
  if (GARBLED_PATTERN.test(message)) {
    const matched = message.match(GARBLED_PATTERN)[0];
    const codePoint = matched.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    errors.push(
      `检测到乱码字符 U+${codePoint}，提交信息中不应包含替换符、控制字符、` +
      `Latin-1 误解码产物或私用区字符，请检查编码后重新提交`
    );
  }

  // 4. 强制 Conventional Commits 格式
  if (!CC_PATTERN.test(firstLine)) {
    errors.push(
      `必须使用 Conventional Commits 格式：<type>(<scope>): <description>\n` +
      `  允许的 type: ${CC_TYPES.join(", ")}\n` +
      `  示例: feat(auth): 添加 OAuth2 登录支持`
    );
  }

  if (errors.length > 0) {
    return {
      decision: "block",
      reason: `[Commit Message] 提交信息质量不达标：\n\n${errors.map((e) => `• ${e}`).join("\n")}\n\n当前 message: "${firstLine}"\n\n请补充具体的改动说明后重新提交。`,
    };
  }
  return null;
}
