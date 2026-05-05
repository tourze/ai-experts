import { readFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { matchExt, hasCommand, findUp } from "./go-_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".go"]);
}

const VET_SKIP_PATTERNS = [
  /go\.mod file not found/i,
  /cannot find main module/i,
  /directory prefix .* does not contain main module/i,
  /directory prefix .* does not contain modules listed in go\.work/i,
  /outside main module/i,
  /no Go files/i,
];

/**
 * 用 gofmt -e 做语法检查（单文件，无需 go module 上下文）。
 * 返回值：undefined = gofmt 不可用，null = 无语法错误，string = 错误信息
 */
function tryGofmt(filePath) {
  try {
    execFileSync("gofmt", ["-e", filePath], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000,
    });
    return null; // 语法正确
  } catch (e) {
    if (e.code === "ENOENT" || e.code === "EACCES") return undefined;
    const stderr = e.stderr?.toString()?.trim();
    return stderr || null;
  }
}

function isEscaped(content, index) {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && content[i] === "\\"; i--) {
    backslashes++;
  }
  return backslashes % 2 === 1;
}

/**
 * 回退：括号配对检查（仅在 gofmt 不可用时使用）
 */
function checkBrackets(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  let braces = 0,
    parens = 0,
    brackets = 0;
  let inString = false,
    inRaw = false,
    inRune = false;
  let inLineComment = false,
    inBlockComment = false;
  let line = 1;
  let stringStartLine = 0;
  let rawStartLine = 0;
  let runeStartLine = 0;
  let blockCommentStartLine = 0;
  for (let i = 0; i < content.length; i++) {
    const c = content[i],
      n = content[i + 1];
    if (c === "\n") {
      line++;
    }
    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && n === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (c === "/" && n === "/") {
      inLineComment = true;
      continue;
    }
    if (c === "/" && n === "*") {
      inBlockComment = true;
      blockCommentStartLine = line;
      continue;
    }
    if (c === "`" && !inString && !inRune) {
      inRaw = !inRaw;
      rawStartLine = inRaw ? line : 0;
      continue;
    }
    if (inRaw) continue;
    if (c === "'" && !inString && !isEscaped(content, i)) {
      inRune = !inRune;
      runeStartLine = inRune ? line : 0;
      continue;
    }
    if (inRune) continue;
    if (c === '"' && !isEscaped(content, i)) {
      inString = !inString;
      stringStartLine = inString ? line : 0;
      continue;
    }
    if (inString) continue;
    if (c === "{") braces++;
    if (c === "}") {
      braces--;
      if (braces < 0) {
        errors.push(`第 ${line} 行出现多余的 }`);
        braces = 0;
      }
    }
    if (c === "(") parens++;
    if (c === ")") {
      parens--;
      if (parens < 0) {
        errors.push(`第 ${line} 行出现多余的 )`);
        parens = 0;
      }
    }
    if (c === "[") brackets++;
    if (c === "]") {
      brackets--;
      if (brackets < 0) {
        errors.push(`第 ${line} 行出现多余的 ]`);
        brackets = 0;
      }
    }
  }
  if (braces !== 0) errors.push(`花括号不配对（差值 ${braces}）`);
  if (parens !== 0) errors.push(`圆括号不配对（差值 ${parens}）`);
  if (brackets !== 0) errors.push(`方括号不配对（差值 ${brackets}）`);
  if (inString) errors.push(`第 ${stringStartLine} 行起始的字符串字面量未闭合`);
  if (inRaw) errors.push(`第 ${rawStartLine} 行起始的原始字符串未闭合`);
  if (inRune) errors.push(`第 ${runeStartLine} 行起始的 rune 字面量未闭合`);
  if (inBlockComment) errors.push(`第 ${blockCommentStartLine} 行起始的块注释未闭合`);

  return errors;
}

function getGoVetRoot(filePath) {
  return findUp(filePath, ["go.mod"]) || findUp(filePath, ["go.work"]);
}

function runGoVet(filePath) {
  if (!hasCommand("go")) return null;

  const vetRoot = getGoVetRoot(filePath);
  if (!vetRoot) return null;

  try {
    execFileSync("go", ["vet", "./..."], {
      cwd: vetRoot,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30000,
    });
    return null;
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EACCES") return null;

    const output = [
      error.stdout?.toString()?.trim(),
      error.stderr?.toString()?.trim(),
    ]
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!output) return null;
    if (VET_SKIP_PATTERNS.some((pattern) => pattern.test(output))) return null;
    return output;
  }
}

async function check(filePath) {
  const errors = [];

  // 1. 语法检查：优先 gofmt -e（完整 Go parser），回退括号配对
  const gofmtResult = tryGofmt(filePath);
  if (gofmtResult === undefined) {
    errors.push(...checkBrackets(filePath));
  } else if (gofmtResult) {
    errors.push(`gofmt 语法错误:\n${gofmtResult}`);
  }

  // 2. 静态检查：仅在找到 go.mod / go.work 时执行 go vet
  const vetResult = runGoVet(filePath);
  if (vetResult) {
    errors.push(`go vet 报错:\n${vetResult}`);
  }

  return errors.length > 0
    ? { lang: "Go Syntax", message: errors.join("\n") }
    : null;
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;
  const result = await check(filePath);
  if (!result) return null;
  return {
    decision: "block",
    reason: `[${result.lang}] ${result.message.trim()}\n\n请修复后再继续。`,
  };
}
