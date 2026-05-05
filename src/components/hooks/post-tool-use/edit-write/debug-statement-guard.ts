import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { existsSync, readFileSync, realpathSync } from "fs";
import { basename, dirname, relative } from "path";
import { execFileSync } from "child_process";
import { isCppSourceFile } from "./_utils.mjs";

export const debugStatementGuardHook = defineHook({
  id: "debug-statement-guard",
  description: "检测 C/C++ 文件中残留的调试输出语句。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./debug-statement-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * 调试语句残留检测 hook（PostToolUse — Edit|Write）
 *
 * 仅检查 C/C++ 源文件中的净新增调试输出，避免把其他语言文件误判到 C/C++ hooks。
 *
 * 检测策略：diff-based，只检查新增代码，不对已有调试语句告警。
 *
 * 决策：仅 report。
 * 跳过条件：测试文件、注释行、非 C/C++ 文件。
 */


const PATTERNS = [
  {
    re: /\bprintf\s*\(\s*"[^"\n]*\bdebug\b[^"\n]*"/i,
    label: 'printf("debug...")',
    hint: "移除临时调试打印，正式日志请走项目日志设施",
  },
  {
    re: /\bputs\s*\(\s*"[^"\n]*\bdebug\b[^"\n]*"/i,
    label: 'puts("debug...")',
    hint: "移除临时调试输出，避免把探针带入提交",
  },
  {
    re: /\b(?:std::)?(?:cerr|clog)\s*<</,
    label: "std::cerr / std::clog",
    hint: "只保留面向用户的错误输出；临时排查日志请在提交前移除",
  },
];

// ── 测试文件检测 ──

function isTestFile(filePath) {
  const name = basename(filePath);
  const normalized = filePath.replaceAll("\\", "/");

  if (/\/(tests?|testdata|fixtures|benchmarks)\//.test(normalized)) return true;
  if (/\.(test|spec)\.(c|cc|cpp|cxx|h|hh|hpp|hxx)$/i.test(name)) return true;
  if (/^(test_|Test).+\.(c|cc|cpp|cxx|h|hh|hpp|hxx)$/i.test(name)) return true;
  if (/(?:_test|_spec|Test)\.(c|cc|cpp|cxx|h|hh|hpp|hxx)$/i.test(name)) return true;

  return false;
}

// ── 注释行检测（简易版，覆盖主流语言单行注释） ──

function isCommentLine(line) {
  const t = line.trim();
  if (t === "") return true;
  return (
    t.startsWith("//") ||
    t.startsWith("#") ||
    t.startsWith("/*") ||
    t.startsWith("*") ||
    t.startsWith("--") ||
    t.startsWith("<!--") ||
    t.startsWith("REM ")
  );
}

// ── 获取 git HEAD 中的文件内容（不存在返回 null） ──

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

// ── 统计文本中的模式匹配数（排除注释行） ──

function countPattern(text, re) {
  if (!text) return 0;
  let count = 0;
  for (const line of text.split("\n")) {
    if (!isCommentLine(line) && re.test(line)) count++;
  }
  return count;
}

function collectFragmentLocations(text, re) {
  const locations = [];
  for (const [index, line] of text.split("\n").entries()) {
    if (!isCommentLine(line) && re.test(line)) {
      locations.push({ scope: "片段", line: index + 1 });
    }
  }
  return locations;
}

function collectFileLocations(text, re, skip) {
  const locations = [];
  let skipped = 0;
  for (const [index, line] of text.split("\n").entries()) {
    if (isCommentLine(line) || !re.test(line)) continue;
    if (skipped < skip) {
      skipped++;
      continue;
    }
    locations.push({ scope: "文件", line: index + 1 });
  }
  return locations;
}

// ── 主入口 ──

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  // 自排除：本文件的规则定义中包含调试关键字（debugger、console.log 等）作为检测数据，
  // 不是真正的调试代码。同理跳过整个 hooks 基础设施目录。
  const norm = filePath.replaceAll("\\", "/");
  if (/\/hooks\/(pre-tool-use|post-tool-use|checkers|notification|stop)\//.test(norm)) return null;

  if (!isCppSourceFile(filePath)) return null;

  // 跳过测试文件
  if (isTestFile(filePath)) return null;

  // 确定新增文本（newText）和基线文本（baselineText）
  const isEdit = payload?.tool_input?.old_string !== undefined;
  let newText, baselineText;

  if (isEdit) {
    newText = payload.tool_input.new_string || "";
    baselineText = payload.tool_input.old_string || "";
  } else {
    // Write 工具：与 git HEAD 对比
    newText = readFileSync(filePath, "utf-8");
    baselineText = getHeadContent(filePath) || "";
  }

  // 逐模式比较：只报告 net-new 的调试语句
  const hits = [];
  for (const p of PATTERNS) {
    const newCount = countPattern(newText, p.re);
    const baseCount = countPattern(baselineText, p.re);
    const netNew = newCount - baseCount;
    if (netNew > 0) {
      hits.push({ ...p, baseCount, count: netNew });
    }
  }

  if (hits.length === 0) return null;

  const locations = [];

  for (const hit of hits) {
    const candidates = isEdit
      ? collectFragmentLocations(newText, hit.re)
      : collectFileLocations(readFileSync(filePath, "utf-8"), hit.re, hit.baseCount);

    for (const location of candidates.slice(0, hit.count)) {
      locations.push({
        ...location,
        label: hit.label,
        hint: hit.hint,
      });
    }
  }

  const totalNew = hits.reduce((sum, h) => sum + h.count, 0);

  // 构建消息
  const detail = locations.length > 0
    ? locations
      .slice(0, 10)
      .map((l) => `  ${l.scope}第 ${l.line} 行: ${l.label} → ${l.hint}`)
      .join("\n")
    : hits
      .map((hit) => `  ${hit.label}: ${hit.count} 处 → ${hit.hint}`)
      .join("\n");
  const suffix = locations.length > 10 ? `\n  … 共 ${locations.length} 处` : "";

  return {
    decision: "report",
    reason: [
      `[Debug Statement] ${filePath} 新增了 ${totalNew} 处候选调试输出：`,
      "",
      detail + suffix,
      "",
      "建议在提交前移除临时调试输出。如果这是有意保留的用户可见错误输出，请确认它不是临时探针。",
    ].join("\n"),
  };
}
