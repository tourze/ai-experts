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
      "检测到当前任务涉及架构、链路、迁移、对比、风险或阶段规划。回复时优先把线性长文改写为 Markdown/ASCII 结构，先让用户看懂全貌，再展开细节。",
      "",
      `  信号类型:${kinds}`,
      `  命中片段:${snippets.map((snippet) => `「${snippet}」`).join("、")}`,
      "",
      "── 表达形态选择 ──",
      "",
      "  • 链路 / 生命周期：缩进树、箭头流、编号步骤",
      "  • 现状 / 问题 / 方案 / 风险：Markdown 表格",
      "  • 目录 / 模块边界：文件树、模块树",
      "  • 阶段 / 优先级 / 执行计划：阶段表、顺序列表",
      "",
      "── 默认组织顺序 ──",
      "",
      "  1. 现状全貌",
      "  2. 问题归类",
      "  3. 方案拆解",
      "  4. 执行顺序 / 风险",
      "  5. 待确认决策",
      "",
      "先给地图，再给结论，再给动作，避免让用户自己在正文里拼上下文。",
      "",
      "── 约束 ──",
      "",
      "  • 一个可视化块只承载一个核心问题，不要把链路、问题、方案、优先级混在一起",
      "  • 如果一句话或一个短列表就能说清，不要强行表格化",
      "  • 标题、列名、节点名必须自解释，避免“这个/那个/这里”",
      "  • 优先使用 Markdown 表格、代码块、ASCII 树、编号分段等纯文本手段",
      "  • 单张表尽量不超过 4 到 6 列，单个树图尽量不超过 3 层主干；超了就拆块",
      "  • 稳定事实和建议动作分区呈现，不要把观察、判断、建议写成一锅粥",
      "",
      "── 复杂方案补充 ──",
      "",
      "复杂主题尽量同时提供：",
      "  • 空间结构：组件、模块、边界、关系",
      "  • 时间结构：先做什么、后做什么、风险在哪里",
      "",
      "依据：原 memory/AGENTS.md「可视化表达与结构化输出」已迁为 docs-expert 的按需注入 hook。",
    ].join("\n"),
  };
}
