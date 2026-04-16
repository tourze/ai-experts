/**
 * 调试语句残留检测 hook（PostToolUse — Edit|Write）
 *
 * 统一收敛原先散落在语言/基础设施插件中的通用版 debug-statement-guard，
 * 通过 coding-expert 依赖向上层插件复用。
 *
 * 检测策略：diff-based，只检查新增代码，不对已有调试语句告警。
 *
 * 两级决策：
 *   Tier 1（block）：纯调试工具 — debugger、breakpoint()、pdb、binding.pry、dd()、dbg!()
 *   Tier 2（report）：可能合法的输出语句 — console.log、print、var_dump
 *
 * 跳过条件：测试文件、注释行。
 */

import { existsSync, readFileSync, realpathSync } from "fs";
import { execFileSync } from "child_process";
import { basename, dirname, extname, relative } from "path";

const RULES = [
  {
    exts: [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts", ".vue", ".svelte"],
    patterns: [
      { re: /\bdebugger\b/, label: "debugger", tier: 1, hint: "移除 debugger 断点" },
      { re: /\bconsole\.log\s*\(/, label: "console.log()", tier: 2, hint: "使用正式日志框架（winston/pino）或移除" },
      { re: /\bconsole\.debug\s*\(/, label: "console.debug()", tier: 2, hint: "使用正式日志框架或移除" },
    ],
  },
  {
    exts: [".py", ".pyi"],
    patterns: [
      { re: /\bbreakpoint\s*\(/, label: "breakpoint()", tier: 1, hint: "移除调试断点" },
      { re: /\bimport\s+pdb\b/, label: "import pdb", tier: 1, hint: "移除 pdb 导入" },
      { re: /\bpdb\.set_trace\s*\(/, label: "pdb.set_trace()", tier: 1, hint: "移除调试断点" },
      { re: /\bimport\s+ipdb\b/, label: "import ipdb", tier: 1, hint: "移除 ipdb 导入" },
      { re: /\bipdb\.set_trace\s*\(/, label: "ipdb.set_trace()", tier: 1, hint: "移除调试断点" },
      { re: /\bprint\s*\(/, label: "print()", tier: 2, hint: "使用 logging 模块或移除" },
    ],
  },
  {
    exts: [".rb"],
    patterns: [
      { re: /\bbinding\.pry\b/, label: "binding.pry", tier: 1, hint: "移除 pry 调试断点" },
      { re: /\bbyebug\b/, label: "byebug", tier: 1, hint: "移除 byebug 断点" },
      { re: /\brequire\s+['\"]pry['\"]/, label: "require 'pry'", tier: 1, hint: "移除 pry 导入" },
      { re: /\bputs\s/, label: "puts", tier: 2, hint: "使用 Logger 或移除" },
    ],
  },
  {
    exts: [".rs"],
    patterns: [
      { re: /\bdbg!\s*\(/, label: "dbg!()", tier: 1, hint: "dbg!() 仅用于调试，请移除或改用 tracing" },
    ],
  },
  {
    exts: [".java", ".kt", ".kts"],
    patterns: [
      { re: /\bSystem\.out\.print(ln)?\s*\(/, label: "System.out.print*()", tier: 2, hint: "使用 SLF4J/Log4j 等日志框架" },
      { re: /\.printStackTrace\s*\(/, label: "e.printStackTrace()", tier: 2, hint: "使用日志框架记录异常" },
    ],
  },
  {
    exts: [".swift"],
    patterns: [
      { re: /\bprint\s*\(/, label: "print()", tier: 2, hint: "使用 os.log / Logger 或 #if DEBUG 包裹" },
      { re: /\bdebugPrint\s*\(/, label: "debugPrint()", tier: 2, hint: "使用 os.log / Logger 替代" },
    ],
  },
  {
    exts: [".go"],
    patterns: [
      { re: /\bfmt\.Print(ln|f)?\s*\(/, label: "fmt.Print*()", tier: 2, hint: "使用 log/slog 包或移除" },
      { re: /\bspew\.Dump\s*\(/, label: "spew.Dump()", tier: 1, hint: "移除 go-spew 调试输出" },
    ],
  },
  {
    exts: [".c", ".cpp", ".cc", ".h", ".hpp"],
    patterns: [
      { re: /\bprintf\s*\(\s*\"[Dd]ebug/, label: "printf(\"debug...\")", tier: 2, hint: "移除调试打印或使用 syslog" },
    ],
  },
  {
    exts: [".sh", ".bash", ".zsh"],
    patterns: [
      { re: /\bset\s+-x\b/, label: "set -x", tier: 2, hint: "trace 模式会泄露敏感信息，请移除" },
    ],
  },
];

function isTestFile(filePath) {
  const name = basename(filePath);
  const normalized = filePath.replaceAll("\\", "/");

  if (/\/(tests?|spec|__tests__|__mocks__|fixtures|e2e)\//.test(normalized)) return true;
  if (/\.(test|spec|e2e)\.[^.]+$/.test(name)) return true;
  if (/^test_/.test(name)) return true;
  if (/_test\.[^.]+$/.test(name)) return true;
  if (/^(Test[A-Z]|.*Tests?)\.(java|kt|kts|swift)$/.test(name)) return true;

  return false;
}

function isCommentLine(line) {
  const text = line.trim();
  if (text === "") return true;
  return (
    text.startsWith("//") ||
    text.startsWith("#") ||
    text.startsWith("/*") ||
    text.startsWith("*") ||
    text.startsWith("--") ||
    text.startsWith("<!--") ||
    text.startsWith("REM ")
  );
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

function countPattern(text, pattern) {
  if (!text) return 0;

  let count = 0;
  for (const line of text.split("\n")) {
    if (!isCommentLine(line) && pattern.test(line)) count++;
  }
  return count;
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  const normalized = filePath.replaceAll("\\", "/");
  if (/\/hooks\/(pre-tool-use|post-tool-use|checkers|notification|stop)\//.test(normalized)) {
    return null;
  }

  const ext = extname(filePath).toLowerCase();
  const ruleSet = RULES.find((rule) => rule.exts.includes(ext));
  if (!ruleSet || isTestFile(filePath)) return null;

  const isEdit = payload?.tool_input?.old_string !== undefined;
  const newText = isEdit
    ? payload.tool_input.new_string || ""
    : readFileSync(filePath, "utf-8");
  const baselineText = isEdit
    ? payload.tool_input.old_string || ""
    : getHeadContent(filePath) || "";

  const hits = [];
  for (const pattern of ruleSet.patterns) {
    const netNew = countPattern(newText, pattern.re) - countPattern(baselineText, pattern.re);
    if (netNew > 0) hits.push({ ...pattern, count: netNew });
  }

  if (hits.length === 0) return null;

  const fileLines = readFileSync(filePath, "utf-8").split("\n");
  const locations = [];

  for (const hit of hits) {
    for (let index = 0; index < fileLines.length; index++) {
      if (!isCommentLine(fileLines[index]) && hit.re.test(fileLines[index])) {
        locations.push({
          line: index + 1,
          label: hit.label,
          hint: hit.hint,
          tier: hit.tier,
        });
      }
    }
  }

  const hasTier1 = hits.some((hit) => hit.tier === 1);
  const detail = locations
    .slice(0, 10)
    .map((location) => `  行 ${location.line}: ${location.label} → ${location.hint}`)
    .join("\n");
  const suffix = locations.length > 10 ? `\n  … 共 ${locations.length} 处` : "";
  const totalNew = hits.reduce((sum, hit) => sum + hit.count, 0);
  const tierLabel = hasTier1 ? "包含必须移除的调试断点" : "包含可能遗留的调试语句";

  return {
    decision: hasTier1 ? "block" : "report",
    reason: [
      `[Debug Statement] ${filePath} 新增了 ${totalNew} 处调试语句（${tierLabel}）：`,
      "",
      detail + suffix,
      "",
      hasTier1
        ? "Tier 1 调试工具（debugger/breakpoint/pdb/dd/dbg! 等）绝不应出现在提交代码中，请移除后继续。"
        : "建议在提交前移除调试输出，或替换为正式的日志框架。如果是有意保留的日志，请忽略此提醒。",
    ].join("\n"),
  };
}
