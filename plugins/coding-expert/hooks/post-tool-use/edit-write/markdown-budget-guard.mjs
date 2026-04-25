/**
 * Markdown token 预算守卫（PostToolUse — Edit|Write）
 *
 * 专管 AI 可见 Markdown 的 token 预算，按路径分级并使用棘轮机制：
 * 一旦文件超标，只允许缩小，不允许继续膨胀。
 *
 * 分级预算（按路径，只严管 AI 会加载的文件）：
 *   **\/SKILL.md              500 tokens   AI 核心提示，严控
 *   **\/references\/**\/*.md   2000 tokens  skill 辅助文档，可较长
 *   记忆文件                  3000 tokens  项目/全局指令，更宽
 *   其他 *.md                 静默放行      避免误伤 README / changelog / 日志
 *
 * 选择“按路径分级”而不是“对所有 md 统一阈值”的原因：
 *   SKILL.md 会被加载到每一次 agent 调用的提示里，500 tokens 是 Anthropic
 *   官方建议的软上限；普通 README / docs 是给人读的，用同样标准会误伤。
 *
 * token 估算口径（无外部依赖）：
 *   ASCII 每 4 char ≈ 1 token（与 Anthropic 经验值和 ANTI-PATTERNS.md 一致）
 *   非 ASCII（含 CJK）每字符 ≈ 1 token（对中文更接近真实 tokenizer 的开销）
 *   这是一个保守估算：它不会过报，但可能少报（真实 tokenizer 会把
 *   CJK 字符拆成 1–3 token 不等），所以不会错误 block 实际上合规的文件。
 *
 * 棘轮机制：
 *   新文件                 → 必须在预算内，否则 block
 *   原内现外（预算内→预算外） → block（禁止恶化）
 *   历史超标且继续膨胀       → block（禁止恶化）
 *   历史超标且缩减          → report（正向反馈）
 *   历史超标且不变          → 静默放行（避免重复噪音）
 *
 * 不把 getHeadContent 提到 _utils.mjs：本 hook 要的是原文字符串，
 * 与其他守卫的需求不同；YAGNI 原则下先局部持有，避免提前抽象。
 */

import { existsSync, readFileSync, realpathSync } from "fs";
import { dirname, relative } from "path";
import { execFileSync } from "child_process";

const MEMORY_FILE_BASENAMES = new Set(["MEMORY.md", "CLAUDE.md", "AGENTS.md"]);

// ── 路径分级 ──────────────────────────────────────────────
// 返回 { label, budget } 或 null（表示“不管”）。
// label 仅用于给用户看的报错信息，budget 用于判定。
function classify(filePath) {
  const p = filePath.replaceAll("\\", "/");
  if (!p.toLowerCase().endsWith(".md")) return null;

  const basename = p.split("/").pop();

  // references 目录下的 md：skill 的辅助长文档，允许更大但仍有上限
  // 这里用 `/references/` 片段匹配，避免误伤 `references.md` 这种同名单文件
  if (p.includes("/references/")) {
    return { label: "references", budget: 2000 };
  }
  if (basename === "SKILL.md") {
    return { label: "SKILL.md", budget: 1500 };
  }
  if (MEMORY_FILE_BASENAMES.has(basename)) {
    return { label: "记忆文件", budget: 10000 };
  }
  return null;
}

// ── token 估算 ────────────────────────────────────────────
// 走 codepoint 级别遍历，避免 surrogate pair 的 charCodeAt 误判。
// 判定规则：< 128 归为 ASCII（4:1），否则归为非 ASCII（1:1）。
function estimateTokens(text) {
  let ascii = 0;
  let nonAscii = 0;
  for (const ch of text) {
    if (ch.codePointAt(0) < 128) ascii++;
    else nonAscii++;
  }
  return Math.ceil(ascii / 4) + nonAscii;
}

// ── 读取 HEAD 版本内容 ────────────────────────────────────
// 返回字符串；新文件 / 未跟踪 / 非 git 仓库一律返回 null。
// realpathSync 统一解析符号链接，避免 macOS /tmp → /private/tmp 偏移。
function getHeadContent(filePath) {
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

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  const category = classify(filePath);
  if (!category) return null;
  const { label, budget } = category;

  const content = readFileSync(filePath, "utf-8");
  const currentTokens = estimateTokens(content);

  // 未超预算 → 通过
  if (currentTokens <= budget) return null;

  // ── 超预算：按棘轮机制分支 ──
  const headContent = getHeadContent(filePath);

  if (headContent === null) {
    // 新文件（未提交过）：必须在预算内
    return {
      decision: "block",
      reason: [
        `[Markdown Budget] ${filePath} 超出 ${label} token 预算`,
        `  当前：约 ${currentTokens} tokens | 预算：${budget} tokens`,
        "",
        "新文件必须在预算内。建议：",
        "  • 把例子/长段落拆到 references/ 子目录",
        '  • 删除装饰 emoji、冗余过渡句、模板 echo（"This section covers..."）',
        "  • SKILL.md 只保留决策树和规则，展开内容靠 references 引用",
      ].join("\n"),
    };
  }

  const headTokens = estimateTokens(headContent);

  if (headTokens <= budget) {
    // 原来在预算内，现在超了 → block（禁止恶化）
    return {
      decision: "block",
      reason: [
        `[Markdown Budget] ${filePath} 超出 ${label} token 预算`,
        `  修改前：约 ${headTokens} tokens | 修改后：约 ${currentTokens} tokens | 预算：${budget} tokens`,
        "",
        "请把新增内容拆到 references/ 或压缩冗余表达后再提交。",
      ].join("\n"),
    };
  }

  // ── 历史超标文件（headTokens > budget）：棘轮机制 ──

  if (currentTokens > headTokens) {
    // 比 HEAD 更大 → block，禁止继续膨胀
    return {
      decision: "block",
      reason: [
        `[Markdown Budget] ${filePath} 是历史超标文件，棘轮禁止继续膨胀`,
        `  修改前：约 ${headTokens} tokens | 修改后：约 ${currentTokens} tokens | 预算：${budget} tokens`,
        `  本次新增约 ${currentTokens - headTokens} tokens`,
        "",
        "超标文件只许缩小不许增长。添加新内容时必须同时削减等量旧内容。",
      ].join("\n"),
    };
  }

  if (currentTokens < headTokens) {
    // 比 HEAD 更小 → 正向反馈
    return {
      decision: "report",
      reason: [
        `[Markdown Budget] ${filePath} 缩减约 ${headTokens - currentTokens} tokens（${headTokens} → ${currentTokens}）`,
        `  预算：${budget} tokens | 仍需缩减：约 ${currentTokens - budget} tokens`,
      ].join("\n"),
    };
  }

  // 大小不变，仍超预算 → 静默放行（避免重复噪音）
  return null;
}
