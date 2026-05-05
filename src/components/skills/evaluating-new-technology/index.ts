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
  useCases: [
    "选型新框架、AI 服务、基础设施工具或第三方平台。",
    "需要参考 [references/guest-insights.md](references/guest-insights.md) 的常见判断维度。",
    "讨论长期不确定性时，可配合 [planning-under-uncertainty](../planning-under-uncertainty/SKILL.md)。",
  ],
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
  ],
});
