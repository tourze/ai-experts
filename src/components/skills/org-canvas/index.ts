import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const orgCanvasSkill = defineSkill({
  id: "org-canvas",
  description: "当用户要用组织画布设计组织架构、检查战略匹配度或规划组织重组时使用。纯岗位 JD 或单点汇报关系调整不适用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for org-canvas.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
