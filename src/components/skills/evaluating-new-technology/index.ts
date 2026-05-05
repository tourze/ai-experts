import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const evaluatingNewTechnologySkill = defineSkill({
  id: "evaluating-new-technology",
  fullName: "评估新技术",
  description: "当用户要评估新技术、做 build vs buy、筛选 AI/软件供应商、判断技术成熟度，或评估产品 AI 功能就绪度时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ai-product-readiness",
      source: new URL("./references/ai-product-readiness.md", import.meta.url),
      target: "references/ai-product-readiness.md",
      title: "ai-product-readiness.md",
      summary: "Reference material for evaluating-new-technology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Reference material for evaluating-new-technology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "tech-maturity-curve",
      source: new URL("./references/tech-maturity-curve.md", import.meta.url),
      target: "references/tech-maturity-curve.md",
      title: "tech-maturity-curve.md",
      summary: "Reference material for evaluating-new-technology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for evaluating-new-technology.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
