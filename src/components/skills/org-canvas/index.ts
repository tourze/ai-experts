import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const orgCanvasSkill = defineSkill({
  id: "org-canvas",
  fullName: "组织模式画布",
  description: "当用户要用组织画布设计组织架构、检查战略匹配度或规划组织重组时使用。纯岗位 JD 或单点汇报关系调整不适用。",
  useCases: [
    "新业务需要从零设计组织结构。",
    "现有组织与战略不匹配，需要重组。",
    "与 `swot-analysis` 和 `raci-matrix` 配合做组织诊断与重设计。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "talent-management",
      source: new URL("./references/talent-management.md", import.meta.url),
      target: "references/talent-management.md",
      title: "talent-management.md",
      summary: "Reference material for org-canvas.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "team-composition-analysis",
      source: new URL("./references/team-composition-analysis.md", import.meta.url),
      target: "references/team-composition-analysis.md",
      title: "team-composition-analysis.md",
      summary: "Reference material for org-canvas.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
