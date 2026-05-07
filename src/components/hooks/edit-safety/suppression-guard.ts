import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync, readFileSync, realpathSync } from "fs";
import { execFileSync } from "child_process";
import { basename, dirname, extname, relative } from "path";

export const suppressionGuardHook = defineHook({
  id: "suppression-guard",
  description: "检测无理由的 ESLint/TS 静态检查抑制注释。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./suppression-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * 静态检查抑制注释守卫（PostToolUse — Edit|Write）
 *
 * 拦截"无理由地屏蔽静态检查"的注释，避免开发者用 disable 把错误吞掉：
 *   - ESLint：// eslint-disable / eslint-disable-next-line / eslint-disable-line
 *             /* eslint-disable [rules] *​/
 *   - TypeScript：// @ts-ignore / @ts-expect-error / @ts-nocheck
 *
 * 放行条件：注释内带 justification —— 即在抑制关键词同一行存在
 *   `--`、`:` 或全角 `：` 后跟任意非空字符。例如：
 *     // eslint-disable-next-line no-console -- CLI 入口需直接打印
 *     // @ts-expect-error: 上游类型未导出，跟踪 issue #123
 *
 * 检测策略：diff-based，只对"新增的无 justification 抑制"告警。
 *
 * 跳过条件：
 *   - 非 JS/TS 类扩展名（.js/.jsx/.ts/.tsx/.mjs/.cjs/.mts/.cts/.vue/.svelte）
 *   - 测试 / fixture 文件
 *   - 仓库自身的 hook 实现文件
 */


const SUPPORTED_EXTS = [
  ".js", ".jsx", ".mjs", ".cjs",
  ".ts", ".tsx", ".mts", ".cts",
  ".vue", ".svelte",
];

const PATTERNS = [
  {
    re: /\beslint-disable(?:-next-line|-line)?\b/,
    label: "eslint-disable",
    hint: "修复违规或调整 ESLint 配置；如确需禁用，写明理由",
  },
  {
    re: /@ts-ignore\b/,
    label: "@ts-ignore",
    hint: "优先改用 @ts-expect-error；若必须保留，写明理由",
  },
  {
    re: /@ts-expect-error\b/,
    label: "@ts-expect-error",
    hint: "需在注释末尾说明为什么期望此处报错",
  },
  {
    re: /@ts-nocheck\b/,
    label: "@ts-nocheck",
    hint: "整文件 TS 检查关闭，风险高；优先拆文件或逐行 expect-error",
  },
];

// 任意 -- / : / ： 后跟一个或多个非空字符 → 视为已写明理由
const JUSTIFICATION_RE = /(?:--|[:：])\s*\S/;

function isTestFile(filePath: string) {
  const name = basename(filePath);
  const normalized = filePath.replaceAll("\\", "/");
  if (/\/(tests?|spec|__tests__|__mocks__|fixtures|e2e)\//.test(normalized)) return true;
  if (/\.(test|spec|e2e)\.[^.]+$/.test(name)) return true;
  return false;
}

function getHeadContent(filePath: string) {
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

function countViolations(text: string, pattern: RegExp) {
  if (!text) return 0;
  let count = 0;
  for (const line of text.split("\n")) {
    if (pattern.test(line) && !JUSTIFICATION_RE.test(line)) count++;
  }
  return count;
}

export async function run(payload: NormalizedHookPayload) {
  const filePath = payload?.tool?.input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  const normalized = filePath.replaceAll("\\", "/");
  if (/\/src\/components\/hooks\//.test(normalized)) {
    return null;
  }

  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTS.includes(ext)) return null;
  if (isTestFile(filePath)) return null;

  const toolInput = payload?.tool?.input;
  const isEdit = toolInput?.old_string !== undefined;
  const newText = isEdit
    ? toolInput?.new_string || ""
    : readFileSync(filePath, "utf-8");
  const baselineText = isEdit
    ? toolInput?.old_string || ""
    : getHeadContent(filePath) || "";

  const hits = [];
  for (const pattern of PATTERNS) {
    const netNew = countViolations(newText, pattern.re) - countViolations(baselineText, pattern.re);
    if (netNew > 0) hits.push({ ...pattern, count: netNew });
  }

  if (hits.length === 0) return null;

  const fileLines = readFileSync(filePath, "utf-8").split("\n");
  const locations = [];
  for (const hit of hits) {
    for (let index = 0; index < fileLines.length; index++) {
      const line = fileLines[index];
      if (hit.re.test(line) && !JUSTIFICATION_RE.test(line)) {
        locations.push({ line: index + 1, label: hit.label, hint: hit.hint });
      }
    }
  }

  const detail = locations
    .slice(0, 10)
    .map((loc) => `  行 ${loc.line}: ${loc.label} → ${loc.hint}`)
    .join("\n");
  const suffix = locations.length > 10 ? `\n  … 共 ${locations.length} 处` : "";
  const totalNew = hits.reduce((sum, hit) => sum + hit.count, 0);

  return {
    decision: "block",
    reason: [
      `[Suppression Guard] ${filePath} 新增了 ${totalNew} 处无理由的静态检查抑制：`,
      "",
      detail + suffix,
      "",
      "如确需保留，请在该行注释末尾用 `-- 原因：xxx` 或 `: 原因：xxx` 写明理由。例如：",
      "  // eslint-disable-next-line no-console -- CLI 入口需直接打印",
      "  // @ts-expect-error: 上游类型未导出，跟踪 issue #123",
      "否则请修复违规或调整 ESLint / TypeScript 配置。",
    ].join("\n"),
  };
}
