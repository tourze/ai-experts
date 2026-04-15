/**
 * 调试语句残留检测 hook（PostToolUse — Edit|Write）
 *
 * 仅检查 Perl 相关文件中的净新增调试语句，
 * 防止 Data::Dumper、warn、$DB::single 等残留提交到仓库。
 *
 * 检测策略：diff-based，只检查新增代码，不对已有调试语句告警。
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, relative } from "node:path";
import { matchExt, matchName } from "./_utils.mjs";

const PERL_EXTENSIONS = [".pl", ".pm", ".t", ".psgi"];
const PERL_FILE_NAMES = [
  "Makefile.PL",
  "Build.PL",
];

const PATTERNS = [
  { re: /\$DB::single\s*=/, label: "$DB::single", tier: 1, hint: "移除 Perl 调试器断点" },
  { re: /\bDB::enable\b/, label: "DB::enable", tier: 1, hint: "移除 Perl 调试器调用" },
  { re: /\buse\s+Data::Dumper\b/, label: "use Data::Dumper", tier: 2, hint: "改用结构化日志或移除" },
  { re: /\bDumper\s*\(/, label: "Dumper()", tier: 2, hint: "改用结构化日志或移除" },
  { re: /\buse\s+Data::Printer\b/, label: "use Data::Printer", tier: 2, hint: "改用结构化日志或移除" },
  { re: /\b[np]p?\s*\(.*\)/, label: "p()/np()", tier: 2, hint: "移除 Data::Printer 调试输出" },
  { re: /\bwarn\s+["']/, label: "warn", tier: 2, hint: "改用 Log::Any / Log::Log4perl 或移除" },
  { re: /\bprint\s+STDERR\b/, label: "print STDERR", tier: 2, hint: "改用结构化日志或移除" },
  { re: /\bCarp::(confess|longmess)\b/, label: "Carp::confess/longmess", tier: 2, hint: "生产代码中改用 croak/carp 或移除" },
  { re: /\buse\s+Devel::/, label: "use Devel::*", tier: 1, hint: "移除 Devel:: 调试模块引用" },
];

function isTestFile(filePath) {
  const name = basename(filePath);
  const normalized = filePath.replaceAll("\\", "/");

  if (/\/(t|xt|tests?)\//.test(normalized)) return true;
  if (/\.t$/u.test(name)) return true;

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

  if (!matchExt(filePath, PERL_EXTENSIONS) && !matchName(filePath, PERL_FILE_NAMES)) {
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
        ? "Perl 调试断点绝不应进入提交代码，请移除后继续。"
        : "建议在提交前移除 Data::Dumper / warn / print STDERR 等调试输出，或替换为 Log::Any / Log::Log4perl。",
    ].join("\n"),
  };
}
