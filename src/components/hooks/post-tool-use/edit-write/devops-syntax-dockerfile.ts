import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { readFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchName } from "./devops-_utils.mjs";
import { basename } from "path";

export const devopsSyntaxDockerfileHook = defineHook({
  id: "devops-syntax-dockerfile",
  description: "检查 Dockerfile 语法和常见反模式。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./devops-syntax-dockerfile.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * Dockerfile 静态检查
 *
 * 两条互斥路径：
 * 1. hadolint 可用 → 调用 hadolint 做全量检查，report 警告
 *    （hadolint 规则多、涵盖风格与最佳实践，report 级别降低中断感）
 * 2. hadolint 不可用 → 回退到 4 条基础正则，block 严重违规
 *    （保底规则只覆盖明显 bug，高信号、低误报，block 强制修复）
 *
 * 同一次调用只会走其中一条，避免双重报告。
 * 项目可通过 .hadolint.yaml 自定义 hadolint 规则，hadolint 自行发现。
 */

function matches(filePath) {
  const name = basename(filePath);
  return name === "Dockerfile" || name.endsWith(".dockerfile");
}

function runHadolint(filePath) {
  try {
    execFileSync(cmd("hadolint"), [filePath], {
      stdio: "pipe",
      timeout: 15000,
    });
    return null;
  } catch (err) {
    const output =
      (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() || null;
  }
}

function checkBasicRules(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  // 1. 禁止使用 :latest 标签
  if (/^FROM\s+\S+:latest/im.test(content)) {
    errors.push("避免使用 :latest 标签，应指定确切版本以保证可复现性");
  }

  // 2. ADD URL 应替换为 curl/wget + RUN
  if (/^ADD\s+https?:\/\//im.test(content)) {
    errors.push("用 curl/wget + RUN 替代 ADD URL，可以控制缓存和错误处理");
  }

  // 3. apt-get install 后未清理缓存
  const aptInstallLines = content.match(/^RUN\s+.*apt-get\s+install\b.*$/gim) || [];
  for (const line of aptInstallLines) {
    if (!content.includes("rm -rf /var/lib/apt/lists")) {
      errors.push("apt-get install 后应清理缓存：rm -rf /var/lib/apt/lists/*");
      break;
    }
  }

  // 4. 复制本地文件应使用 COPY 而非 ADD
  const addLocalLines = content.match(/^ADD\s+(?!https?:\/\/)\S+/gim) || [];
  for (const line of addLocalLines) {
    if (!/\.tar|\.gz|\.bz2|\.xz/i.test(line)) {
      errors.push("复制本地文件应使用 COPY 而非 ADD（ADD 仅在需要自动解压时使用）");
      break;
    }
  }

  return errors.length ? errors.join("\n") : null;
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;

  // 优先跑 hadolint（全量 linter，report 级别）
  if (hasCommand("hadolint")) {
    const output = runHadolint(filePath);
    if (!output) return null;
    return {
      decision: "report",
      reason: `[hadolint] ${output}`,
    };
  }

  // 回退：基础规则（高信号，block 级别）
  const errors = checkBasicRules(filePath);
  if (!errors) return null;
  return {
    decision: "block",
    reason: `[Dockerfile] ${errors}\n\n请修复后再继续。`,
  };
}
