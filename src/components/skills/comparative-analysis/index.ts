import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { deepResearchSkill } from "../deep-research/index";

export const comparativeAnalysisSkill = defineSkill({
  id: "comparative-analysis",
  fullName: "对比分析",
  description: "当用户要对比两个或多个仓库、框架、方案、工具或系统，需要结构化差异矩阵、优劣判断和可落地建议时使用。",
  useCases: [
    "用户说\"A 和 B 哪个好\"\"帮我对比 X 和 Y\"\"选哪个方案\"。",
    "技术选型、架构决策、工具评估中需要有理有据的比较。",
    "对比对象可以是：仓库、框架、云服务、设计方案、架构模式。",
    "如果只需分析单个仓库，直接进入分析流程。",
    "如果对比的外部概念需要先收集信息，先用 `deep-research`。",
  ],
  constraints: [
    "先明确对比维度，再逐维度展开。维度从用户场景出发，不凑数。",
    "每个维度必须有具体证据（代码、文档、数据），不能只凭印象。",
    "避免假对称：A 和 B 解决不同问题时，先说清定位差异。",
    "必须下判断——用户要\"该选哪个\"，不是\"两个都行\"。",
    "判断附带适用条件：\"场景 X 选 A；场景 Y 选 B\"。",
    "按 [输出模板](references/output-template.md) 输出。",
  ],
  relatedSkills: [
    {
      get id() {
        return deepResearchSkill.id;
      },
      reason: "如果对比的外部概念需要先收集信息，先用 `deep-research`。",
    },
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
