/**
 * 文件行数预算守卫（PostToolUse — Edit|Write）
 *
 * 棘轮机制（ratchet）：
 *   正常文件 → 超出扩展名预算时 block
 *   超标文件 → 冻结在 git HEAD 行数，只许缩小不许膨胀
 *   新文件   → 必须在预算内
 *
 * 替代原 file-length-guard 的固定阈值告警，实现"不能继续恶化"的渐进式治理。
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, extname, relative } from "node:path";
import { countLines, getLowerBaseName } from "./_utils.mjs";

const BUDGETS_BY_EXTENSION = {
  ".rb": 500,
  ".rake": 400,
  ".gemspec": 300,
  ".ru": 200,
  ".erb": 300,
  ".haml": 300,
  ".slim": 300,
  ".builder": 300,
  ".jbuilder": 250,
  ".rjs": 250,
};

const BUDGETS_BY_FILE_NAME = {
  "rakefile": 300,
  "config.ru": 200,
  "guardfile": 200,
  "capfile": 200,
  "fastfile": 400,
  "podfile": 300,
  "appraisals": 200,
};

function getRubyBudget(filePath) {
  const baseName = getLowerBaseName(filePath);
  return BUDGETS_BY_FILE_NAME[baseName] ?? BUDGETS_BY_EXTENSION[extname(baseName)] ?? null;
}

/**
 * 获取文件在 git HEAD 中的行数。
 * 返回 null 表示：新文件 / 未跟踪 / 非 git 仓库。
 */
function getHeadLineCount(filePath) {
  const cwd = dirname(filePath);
  try {
    const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
    // realpathSync 统一解析符号链接（macOS /tmp → /private/tmp）
    const realRoot = realpathSync(repoRoot);
    const realFile = realpathSync(filePath);
    const relPath = relative(realRoot, realFile).replaceAll("\\", "/");
    const content = execFileSync("git", ["show", `HEAD:${relPath}`], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    });
    return countLines(content);
  } catch {
    return null;
  }
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  const budget = getRubyBudget(filePath);
  if (!budget) return null;

  const currentLines = countLines(readFileSync(filePath, "utf-8"));

  // 未超预算 → 通过
  if (currentLines <= budget) return null;

  // ── 超预算：判断是新文件、正常文件还是历史超标文件 ──
  const headLines = getHeadLineCount(filePath);

  if (headLines === null) {
    // 新文件（未提交过）：必须在预算内
    return {
      decision: "block",
      reason: [
        `[File Budget] ${filePath} 超出 Ruby 文件行数预算`,
        `  当前: ${currentLines} 行 | 预算: ${budget} 行`,
        "",
        "新文件必须在预算内。请拆分为多个职责单一的文件。",
      ].join("\n"),
    };
  }

  if (headLines <= budget) {
    // 原来在预算内，现在超了 → block
    return {
      decision: "block",
      reason: [
        `[File Budget] ${filePath} 超出 Ruby 文件行数预算`,
        `  修改前: ${headLines} 行 | 修改后: ${currentLines} 行 | 预算: ${budget} 行`,
        "",
        "请拆分逻辑到独立文件，保持单文件在预算内。",
      ].join("\n"),
    };
  }

  // ── 历史超标文件（headLines > budget）：棘轮机制 ──

  if (currentLines > headLines) {
    // 比 HEAD 更大 → block，禁止膨胀
    return {
      decision: "block",
      reason: [
        `[File Budget] ${filePath} 是历史超标文件，棘轮机制禁止继续膨胀`,
        `  修改前: ${headLines} 行 | 修改后: ${currentLines} 行 | 预算: ${budget} 行`,
        `  增加了 ${currentLines - headLines} 行`,
        "",
        "超标文件只许缩小不许增长。请在添加新内容的同时拆分已有逻辑。",
      ].join("\n"),
    };
  }

  if (currentLines < headLines) {
    // 比 HEAD 更小 → 正向反馈
    return {
      decision: "report",
      reason: [
        `[File Budget] ${filePath} 缩减了 ${headLines - currentLines} 行（${headLines} → ${currentLines}）`,
        `  预算: ${budget} 行 | 还需缩减: ${currentLines - budget} 行`,
      ].join("\n"),
    };
  }

  // 大小不变，仍超预算 → 提醒
  return {
    decision: "report",
    reason: `[File Budget] ${filePath} 仍超出预算（${currentLines}/${budget} 行），建议后续拆分。`,
  };
}
