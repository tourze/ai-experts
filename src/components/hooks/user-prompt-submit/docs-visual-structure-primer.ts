import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const docsVisualStructurePrimerHook = defineHook({
  id: "docs-visual-structure-primer",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./docs-visual-structure-primer.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * visual-structure-primer (UserPromptSubmit) — 命中架构、链路、迁移、对比、
 * 风险或阶段规划等信号时，注入纯文本可视化与结构化表达规则。
 */

const SIGNALS = [
  { re: /架构|拓扑|系统结构|模块边界|目录结构|文件树/, kind: "structure" },
  { re: /链路|调用链|调用过程|执行流程|状态流转|生命周期|时序|流程图/, kind: "flow" },
  { re: /方案对比|对比方案|优缺点对比|trade[- ]?off|对比矩阵|比较方案/i, kind: "compare" },
  { re: /迁移计划|迁移方案|迁移路径|rollout|迁移步骤|阶段推进|里程碑|roadmap/i, kind: "plan" },
  { re: /风险分层|风险矩阵|风险拆解|风险评估|执行顺序|优先级排序/, kind: "risk" },
  { re: /\barchitecture\b|\btopology\b|\bmodule boundary\b|\bfile tree\b/i, kind: "structure" },
  { re: /\bflow\b|\blifecycle\b|\bcall chain\b|\bsequence\b|\bstate transition\b/i, kind: "flow" },
  { re: /\bcompare\b|\bcomparison\b|\bdecision matrix\b|\btrade[- ]?off\b/i, kind: "compare" },
  { re: /\bmigration plan\b|\brollout plan\b|\bphase(?:d)?\b|\bmilestone\b|\broadmap\b/i, kind: "plan" },
  { re: /\brisk\b|\bpriority\b|\bexecution order\b|\bdependency map\b/i, kind: "risk" },
];

const MIN_PROMPT_LENGTH = 12;

function findHits(prompt) {
  const hits = [];

  for (const { re, kind } of SIGNALS) {
    const match = prompt.match(re);
    if (match) {
      hits.push({ kind, snippet: match[0].trim() });
    }
  }

  return hits;
}

export async function run(payload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;
  if (trimmed.startsWith("/")) return null;

  const hits = findHits(trimmed);
  if (hits.length === 0) return null;

  const kindLabels = {
    structure: "结构 / 边界",
    flow: "链路 / 生命周期",
    compare: "方案对比",
    plan: "迁移 / 阶段计划",
    risk: "风险 / 优先级",
  };

  const kinds = [...new Set(hits.map((hit) => kindLabels[hit.kind] || hit.kind))].join("、");
  const snippets = [...new Set(hits.map((hit) => hit.snippet))].slice(0, 5);

  return {
    decision: "context",
    reason: [
      "[Visual Structure Primer] 结构化表达 触发",
      "",
      "检测到当前任务涉及架构、链路、迁移、对比或风险。优先给结构化输出。",
      "",
      `  信号类型:${kinds}`,
      `  命中片段:${snippets.map((snippet) => `「${snippet}」`).join("、")}`,
      "",
      "── 默认组织顺序 ──",
      "  1. 现状全貌",
      "  2. 问题归类",
      "  3. 方案拆解",
      "  4. 执行顺序 / 风险",
      "  5. 待确认决策",
      "  形态建议：阶段 / 优先级 / 执行计划 用阶段表。",
      "",
      "── 画图策略 ──",
      "  • 如果图比纯文本块更能降低理解成本，就不要停在“建议画图”；直接落 Mermaid 源码",
      "  • 需要成品图、主题化 SVG 或终端 ASCII 预览时，主动使用 `pretty-mermaid` skill 渲染，而不是只给未落地的草图建议",
      "  • 文档编排与 Mermaid 源码组织优先参考 `markdown-mermaid-writing`",
      "",
      "通用结构化规则以全局记忆文件为准。",
    ].join("\n"),
  };
}
