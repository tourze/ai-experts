import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const marketingPlanSkill = defineSkill({
  id: "marketing-plan",
  description: "当用户要写市场方案、推广策划案、上市传播计划、整合营销方案，或把 Brief 转成阶段策略和落地活动时使用；若只做 STP、4P、投放预算或活动复盘，切到对应 skill。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ansoff-matrix",
      source: new URL("./references/ansoff-matrix.md", import.meta.url),
      target: "references/ansoff-matrix.md",
      title: "ansoff-matrix.md",
      summary: "Reference material for marketing-plan.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "market-plan-template",
      source: new URL("./references/market-plan-template.md", import.meta.url),
      target: "references/market-plan-template.md",
      title: "market-plan-template.md",
      summary: "Reference material for marketing-plan.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "marketing-mix-4p",
      source: new URL("./references/marketing-mix-4p.md", import.meta.url),
      target: "references/marketing-mix-4p.md",
      title: "marketing-mix-4p.md",
      summary: "Reference material for marketing-plan.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for marketing-plan.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
