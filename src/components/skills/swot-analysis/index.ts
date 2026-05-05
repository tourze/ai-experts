import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const swotAnalysisSkill = defineSkill({
  id: "swot-analysis",
  fullName: "SWOT 分析",
  description: "当用户要做 SWOT 分析、梳理优势劣势、外部机会威胁与战略动作时使用；适合产品、业务或竞争位置评估。",
  useCases: [
    "产品/公司战略评估、年度复盘、竞品对比或进入新市场前的结构化判断。",
    "需要看行业结构或具体对手时，可配合 [porters-five-forces](../porters-five-forces/SKILL.md) 与 [competitive-teardown](../competitive-intelligence/SKILL.md)。",
    "补充分析框架：[references/blue-ocean-strategy.md](references/blue-ocean-strategy.md) — 蓝海战略（ERRC 网格、策略画布）；[references/space-matrix.md](references/space-matrix.md) — SPACE 矩阵（战略态势定位）。",
  ],
  constraints: [
    "Strength/Weakness 写内部能力，Opportunity/Threat 写外部环境，别混淆。",
    "SWOT 不是四格词云，每个点都要连接到战略动作。",
    "先列事实和证据，再做判断，避免把偏好写成优势。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "blue-ocean-strategy",
      source: new URL("./references/blue-ocean-strategy.md", import.meta.url),
      target: "references/blue-ocean-strategy.md",
      title: "blue-ocean-strategy.md",
      summary: "Reference material for swot-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "space-matrix",
      source: new URL("./references/space-matrix.md", import.meta.url),
      target: "references/space-matrix.md",
      title: "space-matrix.md",
      summary: "Reference material for swot-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
