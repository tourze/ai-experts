import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const comparativeAnalysisSkill = defineSkill({
  id: "comparative-analysis",
  fullName: "对比分析",
  description: "当用户要对比两个或多个仓库、框架、方案、工具或系统，需要结构化差异矩阵、优劣判断和可落地建议时使用。",
  useCases: [
    "用户说\"A 和 B 哪个好\"\"帮我对比 X 和 Y\"\"选哪个方案\"。",
    "技术选型、架构决策、工具评估中需要有理有据的比较。",
    "对比对象可以是：仓库、框架、云服务、设计方案、架构模式。",
    "如果只需分析单个仓库，直接进入分析流程。",
    "如果对比的外部概念需要先收集信息，先用 [deep-research](../deep-research/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "output-template",
      source: new URL("./references/output-template.md", import.meta.url),
      target: "references/output-template.md",
      title: "output-template.md",
      summary: "Reference material for comparative-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
