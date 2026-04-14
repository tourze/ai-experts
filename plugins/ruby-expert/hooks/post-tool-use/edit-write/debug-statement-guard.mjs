/**
 * 调试语句残留检测 hook（PostToolUse — Edit|Write）
 *
 * 仅检查 Ruby / Rails 相关文件中的净新增调试语句，
 * 防止 binding.pry、byebug、debugger、puts 等残留提交到仓库。
 *
 * 检测策略：diff-based，只检查新增代码，不对已有调试语句告警。
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, relative } from "node:path";
import { matchExt, matchName } from "./_utils.mjs";

const RUBY_EXTENSIONS = [".rb", ".rake", ".gemspec", ".ru"];
const RUBY_FILE_NAMES = [
  "Rakefile",
  "Guardfile",
  "Capfile",
  "Fastfile",
  "Podfile",
  "Appraisals",
  "config.ru",
];

const PATTERNS = [
  { re: /\bbinding\.pry\b/, label: "binding.pry", tier: 1, hint: "移除 pry 调试断点" },
  { re: /\bbinding\.irb\b/, label: "binding.irb", tier: 1, hint: "移除 irb 调试断点" },
  { re: /\bbyebug\b/, label: "byebug", tier: 1, hint: "移除 byebug 断点或引用" },
  { re: /\bdebugger\b/, label: "debugger", tier: 1, hint: "移除 ruby/debug 断点" },
  { re: /\brequire\s+['"]pry['"]/, label: "require 'pry'", tier: 1, hint: "移除 pry 引用" },
  { re: /\brequire\s+['"]byebug['"]/, label: "require 'byebug'", tier: 1, hint: "移除 byebug 引用" },
  { re: /\brequire\s+['"]debug['"]/, label: "require 'debug'", tier: 1, hint: "生产代码中不要遗留 debug gem 引用" },
  { re: /\bputs(?:\s|\()/, label: "puts", tier: 2, hint: "改用 Logger / Rails.logger 或移除" },
  { re: /\bpp(?:\s|\()/, label: "pp", tier: 2, hint: "改用结构化日志或移除" },
];

function isTestFile(filePath) {
  const name = basename(filePath);
  const normalized = filePath.replaceAll("\\", "/");

  if (/\/(spec|test|tests|fixtures)\//.test(normalized)) return true;
  if (/(_spec|_test)\.rb$/u.test(name)) return true;
  if (/^[a-z0-9_]+_spec\.rake$/u.test(name)) return true;

  return false;
}

function isCommentLine(line) {
  const t = line.trim();
  return t === "" || t.startsWith("#");
}

function getHeadContent(filePath) {
  try {
    const cwd = dirname(filePath);
    const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
    const realRoot = realpathSync(repoRoot);
    const realFile = realpathSync(filePath);
    const relPath = relative(realRoot, realFile).replaceAll("\\", "/");
    return execFileSync("git", ["show", `HEAD:${relPath}`], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    });
  } catch {
    return null;
  }
}

function countPattern(text, re) {
  if (!text) return 0;
  let count = 0;
  for (const line of text.split("\n")) {
    if (!isCommentLine(line) && re.test(line)) count++;
  }
  return count;
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  const norm = filePath.replaceAll("\\", "/");
  if (/\/hooks\/(pre-tool-use|post-tool-use|checkers|notification|stop)\//.test(norm)) {
    return null;
  }

  if (!matchExt(filePath, RUBY_EXTENSIONS) && !matchName(filePath, RUBY_FILE_NAMES)) {
    return null;
  }

  if (isTestFile(filePath)) return null;

  const isEdit = payload?.tool_input?.old_string !== undefined;
  let newText, baselineText;

  if (isEdit) {
    newText = payload.tool_input.new_string || "";
    baselineText = payload.tool_input.old_string || "";
  } else {
    newText = readFileSync(filePath, "utf-8");
    baselineText = getHeadContent(filePath) || "";
  }

  const hits = [];
  for (const p of PATTERNS) {
    const newCount = countPattern(newText, p.re);
    const baseCount = countPattern(baselineText, p.re);
    const netNew = newCount - baseCount;
    if (netNew > 0) {
      hits.push({ ...p, count: netNew });
    }
  }

  if (hits.length === 0) return null;

  const fileContent = readFileSync(filePath, "utf-8");
  const fileLines = fileContent.split("\n");
  const locations = [];

  for (const hit of hits) {
    for (let i = 0; i < fileLines.length; i++) {
      if (!isCommentLine(fileLines[i]) && hit.re.test(fileLines[i])) {
        locations.push({
          line: i + 1,
          label: hit.label,
          hint: hit.hint,
          tier: hit.tier,
        });
      }
    }
  }

  const hasTier1 = hits.some((h) => h.tier === 1);
  const decision = hasTier1 ? "block" : "report";
  const totalNew = hits.reduce((sum, h) => sum + h.count, 0);

  const detail = locations
    .slice(0, 10)
    .map((l) => `  行 ${l.line}: ${l.label} → ${l.hint}`)
    .join("\n");
  const suffix = locations.length > 10 ? `\n  … 共 ${locations.length} 处` : "";

  const tierLabel = hasTier1
    ? "包含必须移除的调试断点"
    : "包含可能遗留的调试语句";

  return {
    decision,
    reason: [
      `[Debug Statement] ${filePath} 新增了 ${totalNew} 处调试语句（${tierLabel}）：`,
      "",
      detail + suffix,
      "",
      hasTier1
        ? "Ruby 调试断点绝不应进入提交代码，请移除后继续。"
        : "建议在提交前移除 puts / pp 等调试输出，或替换为 Logger / Rails.logger。",
    ].join("\n"),
  };
}
