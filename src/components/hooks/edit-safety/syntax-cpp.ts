import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "fs";
import { execFileSync } from "child_process";
import { extname } from "path";
import { isCppSourceFile, cmd, hasCommand } from "../_shared/hook-edit-write-utils";
import { getErrorCode, getExecOutput } from "../_shared/error-utils";

export const syntaxCppHook = defineHook({
  id: "syntax-cpp",
  description: "用 clang/gcc 检查 C/C++ 文件语法错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./syntax-cpp.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * C/C++ 语法检查 hook（PostToolUse — Edit|Write）
 *
 * 三层回退策略：
 *   1. clang -fsyntax-only（最准确，支持 C/C++ 全部语法）
 *   2. gcc -fsyntax-only（clang 不可用时）
 *   3. 括号配对检查（编译器都不可用时）
 *
 * 只对源文件（.c/.cc/.cpp/.cxx）做编译器检查；
 * 头文件（.h/.hpp 等）只做括号配对，因为头文件通常无法独立编译。
 * 模块文件（.ixx/.cppm）也只做括号配对，因为需要特殊编译参数。
 */

// 可以用编译器做语法检查的扩展名（源文件）
const COMPILABLE_EXTENSIONS = new Set([".c", ".cc", ".cpp", ".cxx"]);

// 头文件和模块文件只做括号配对
function isHeaderOrModule(filePath: string) {
  const ext = extname(filePath).toLowerCase();
  return isCppSourceFile(filePath) && !COMPILABLE_EXTENSIONS.has(ext);
}

// ── include 错误过滤 ──
// 缺少头文件不是语法问题，应跳过
const INCLUDE_ERROR_RE = /fatal error:.*file not found|no such file or directory|cannot open source file/i;
const ERROR_LINE_RE = /:\d+:\d+:\s*(?:fatal )?error:/;

function filterSyntaxErrors(output: string) {
  const lines = output.split("\n");
  const syntaxErrors = [];
  let inIncludeError = false;

  for (const line of lines) {
    if (INCLUDE_ERROR_RE.test(line)) {
      inIncludeError = true;
      continue;
    }
    if (ERROR_LINE_RE.test(line) && !INCLUDE_ERROR_RE.test(line)) {
      inIncludeError = false;
      syntaxErrors.push(line);
      continue;
    }
    // 保留错误的上下文行（缩进的代码行和指示符行）
    if (!inIncludeError && syntaxErrors.length > 0) {
      syntaxErrors.push(line);
    }
  }

  return syntaxErrors.join("\n").trim();
}

// ── 编译器语法检查 ──
function tryCompiler(compilerName: string, filePath: string) {
  if (!hasCommand(compilerName)) return undefined;

  try {
    execFileSync(
      cmd(compilerName),
      ["-fsyntax-only", "-w", filePath],
      { stdio: ["ignore", "pipe", "pipe"], timeout: 15000 },
    );
    return null; // 语法正确
  } catch (e: unknown) {
    const code = getErrorCode(e);
    if (code === "ENOENT" || code === "EACCES") return undefined;
    const stderr = getExecOutput(e).trim();
    if (!stderr) return null;

    // 过滤掉 include 错误
    const syntaxOnly = filterSyntaxErrors(stderr);
    return syntaxOnly || null;
  }
}

// ── 括号配对回退 ──
function checkBrackets(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  let braces = 0, parens = 0, brackets = 0;
  let inString = false, inChar = false, inRaw = false;
  let inLineComment = false, inBlockComment = false;
  let line = 1;
  let stringStartLine = 0, blockCommentStartLine = 0;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const n = content[i + 1];

    if (c === "\n") {
      line++;
      if (inLineComment) inLineComment = false;
    }

    if (inLineComment) continue;

    if (inBlockComment) {
      if (c === "*" && n === "/") { inBlockComment = false; i++; }
      continue;
    }

    // 原始字符串：R"delimiter(...)delimiter"
    if (inRaw) {
      // 简化处理：找 )" 结束
      if (c === ")" && n === '"') { inRaw = false; i++; }
      continue;
    }

    if (c === "/" && n === "/") { inLineComment = true; i++; continue; }
    if (c === "/" && n === "*") { inBlockComment = true; blockCommentStartLine = line; i++; continue; }

    // 字符串
    if (c === '"' && !inChar) {
      if (!inString) {
        // 检查是否为 R" 原始字符串
        if (i > 0 && content[i - 1] === "R") { inRaw = true; continue; }
        inString = true;
        stringStartLine = line;
      } else {
        // 检查转义
        let esc = 0;
        for (let j = i - 1; j >= 0 && content[j] === "\\"; j--) esc++;
        if (esc % 2 === 0) inString = false;
      }
      continue;
    }
    if (inString) continue;

    // 字符字面量
    if (c === "'") {
      if (!inChar) { inChar = true; continue; }
      let esc = 0;
      for (let j = i - 1; j >= 0 && content[j] === "\\"; j--) esc++;
      if (esc % 2 === 0) inChar = false;
      continue;
    }
    if (inChar) continue;

    // 括号计数
    if (c === "{") braces++;
    if (c === "}") { braces--; if (braces < 0) { errors.push(`第 ${line} 行出现多余的 }`); braces = 0; } }
    if (c === "(") parens++;
    if (c === ")") { parens--; if (parens < 0) { errors.push(`第 ${line} 行出现多余的 )`); parens = 0; } }
    if (c === "[") brackets++;
    if (c === "]") { brackets--; if (brackets < 0) { errors.push(`第 ${line} 行出现多余的 ]`); brackets = 0; } }
  }

  if (braces !== 0) errors.push(`花括号不配对（差值 ${braces}）`);
  if (parens !== 0) errors.push(`圆括号不配对（差值 ${parens}）`);
  if (brackets !== 0) errors.push(`方括号不配对（差值 ${brackets}）`);
  if (inString) errors.push(`第 ${stringStartLine} 行起始的字符串字面量未闭合`);
  if (inBlockComment) errors.push(`第 ${blockCommentStartLine} 行起始的块注释未闭合`);

  return errors;
}

async function check(filePath: string) {
  const errors = [];

  // 头文件和模块文件：只做括号配对
  if (isHeaderOrModule(filePath)) {
    errors.push(...checkBrackets(filePath));
    return errors.length > 0
      ? { lang: "C/C++ Bracket Check", message: errors.join("\n") }
      : null;
  }

  // 源文件：优先编译器，回退括号配对
  const clangResult = tryCompiler("clang", filePath);
  if (clangResult === null) return null;  // clang 可用且通过
  if (typeof clangResult === "string") {
    return { lang: "C/C++ Syntax (clang)", message: clangResult };
  }

  // clang 不可用，尝试 gcc/g++
  const ext = extname(filePath).toLowerCase();
  const gccName = ext === ".c" ? "gcc" : "g++";
  const gccResult = tryCompiler(gccName, filePath);
  if (gccResult === null) return null;
  if (typeof gccResult === "string") {
    return { lang: `C/C++ Syntax (${gccName})`, message: gccResult };
  }

  // 编译器都不可用，回退括号配对
  errors.push(...checkBrackets(filePath));
  return errors.length > 0
    ? { lang: "C/C++ Bracket Check", message: errors.join("\n") }
    : null;
}

export async function run(payload: LegacyHookPayload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!isCppSourceFile(filePath)) return null;
  const result = await check(filePath);
  if (!result) return null;
  return {
    decision: "block",
    reason: `[${result.lang}] ${result.message.trim()}\n\n请修复后再继续。`,
  };
}
