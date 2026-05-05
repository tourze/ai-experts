import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const bcgMatrixSkill = defineSkill({
  id: "bcg-matrix",
  fullName: "BCG 矩阵（波士顿矩阵 + GE-McKinsey 九宫格）",
  description: "当用户要用 BCG/GE 矩阵做产品组合分析、业务优先级排序或资源分配决策时使用。",
  useCases: [
    "多产品/多业务线公司的资源分配、投资优先级排序。",
    "默认 BCG 2x2 快速分类；需要更精细的多维评估时切到 GE-McKinsey 九宫格模式（见下文）。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
