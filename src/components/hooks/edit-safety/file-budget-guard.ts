import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { execFileSync } from "child_process";
import { existsSync, readFileSync, realpathSync } from "fs";
import { dirname, extname, relative } from "path";
import { countLines, getLowerBaseName } from "../_shared/hook-edit-write-utils";

export const fileBudgetGuardHook = defineHook({
  id: "file-budget-guard",
  description: "检查代码文件是否超出行数预算（棘轮机制）。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./file-budget-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * 文件行数预算守卫（PostToolUse — Edit|Write）
 *
 * 棘轮机制（ratchet）：
 *   正常文件 → 超出预算时 block
 *   超标文件 → 冻结在 git HEAD 行数，只许缩小不许膨胀
 *   新文件   → 必须在预算内
 *   测试文件 → 不纳入行数预算
 *
 * 统一收敛原先散落在语言能力目录中的 file-budget-guard。
 */


const BUDGETS_BY_EXTENSION: Record<string, number> = {
  ".gradle": 600,
  ".js": 500,
  ".jsx": 500,
  "": 500,
  ".cjs": 500,
  ".ts": 500,
  ".tsx": 500,
  ".vue": 500,
  ".svelte": 500,
  ".py": 500,
  ".php": 500,
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
  ".go": 800,
  ".rs": 800,
  ".java": 800,
  ".kt": 500,
  ".kts": 500,
  ".swift": 500,
  ".c": 800,
  ".cc": 800,
  ".cpp": 800,
  ".cxx": 800,
  ".h": 500,
  ".hh": 500,
  ".hpp": 500,
  ".hxx": 500,
  ".ixx": 500,
  ".cppm": 500,
  ".ipp": 400,
  ".tpp": 400,
  ".inl": 300,
  ".cmake": 300,
  ".cs": 800,
  ".lua": 500,
  ".sh": 300,
  ".bash": 300,
  ".zsh": 300,
  ".pl": 500,
  ".pm": 500,
  ".t": 400,
  ".psgi": 300,
  ".xs": 600,
};

const BUDGETS_BY_FILE_NAME: Record<string, number> = {
  "cmakelists.txt": 300,
  "makefile": 300,
  "gnumakefile": 300,
  "rakefile": 300,
  "config.ru": 200,
  "guardfile": 200,
  "capfile": 200,
  "fastfile": 400,
  "podfile": 300,
  "appraisals": 200,
  "makefile.pl": 300,
  "build.pl": 300,
};

const TEST_FILE_PATTERNS = [
  /test\.php$/i,
  /test\.ts$/i,
  /test\.tsx$/i,
  /test\.js$/i,
  /test\.jsx$/i,
  /test\.py$/i,
  /test\.java$/i,
  /test\.kt$/i,
  /test\.go$/i,
  /test\.rs$/i,
  /test\.rb$/i,
  /\.spec\.[jt]sx?$/i,
  /_test\.go$/i,
  /_test\.py$/i,
  /_test\.rb$/i,
  /\.test\.[cm]?[jt]s$/i,
];

const TEST_DIR_PATTERNS = [
  /[/\\]tests?[/\\]/i,
  /[/\\]__tests__[/\\]/i,
  /[/\\]spec[/\\]/i,
];

function isTestFile(filePath: string) {
  const baseName = getLowerBaseName(filePath);
  if (TEST_FILE_PATTERNS.some((re) => re.test(baseName))) return true;
  return TEST_DIR_PATTERNS.some((re) => re.test(filePath));
}

function getBudget(filePath: string) {
  if (isTestFile(filePath)) return null;
  const baseName = getLowerBaseName(filePath);
  return BUDGETS_BY_FILE_NAME[baseName] ?? BUDGETS_BY_EXTENSION[extname(baseName)] ?? null;
}

function getHeadLineCount(filePath: string) {
  const cwd = dirname(filePath);
  try {
    const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
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

export async function run(payload: NormalizedHookPayload) {
  const filePath = payload?.tool?.input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  const budget = getBudget(filePath);
  if (!budget) return null;

  const currentLines = countLines(readFileSync(filePath, "utf-8"));
  if (currentLines <= budget) return null;

  const headLines = getHeadLineCount(filePath);

  if (headLines === null) {
    return {
      decision: "block",
      reason: [
        `[File Budget] ${filePath} 超出文件行数预算`,
        `  当前: ${currentLines} 行 | 预算: ${budget} 行`,
        "",
        "新文件必须在预算内。请拆分为多个职责单一的文件。",
      ].join("\n"),
    };
  }

  if (headLines <= budget) {
    return {
      decision: "block",
      reason: [
        `[File Budget] ${filePath} 超出文件行数预算`,
        `  修改前: ${headLines} 行 | 修改后: ${currentLines} 行 | 预算: ${budget} 行`,
        "",
        "请拆分逻辑到独立文件，保持单文件在预算内。",
      ].join("\n"),
    };
  }

  if (currentLines > headLines) {
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
    return {
      decision: "report",
      reason: [
        `[File Budget] ${filePath} 缩减了 ${headLines - currentLines} 行（${headLines} → ${currentLines}）`,
        `  预算: ${budget} 行 | 还需缩减: ${currentLines - budget} 行`,
      ].join("\n"),
    };
  }

  return {
    decision: "report",
    reason: `[File Budget] ${filePath} 仍超出预算（${currentLines}/${budget} 行），建议后续拆分。`,
  };
}
