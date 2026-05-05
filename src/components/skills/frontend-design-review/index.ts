import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const frontendDesignReviewSkill = defineSkill({
  id: "frontend-design-review",
  description: "当需要审查前端界面质量或避免 AI 套版感时使用（UI 实现层：设计还原度、可访问性、响应式、设计系统一致性）。产品策略级设计审视用 `product-design-critic`；交互可用性诊断用 `ux-heuristics`。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "absolute-bans",
      source: new URL("./references/absolute-bans.md", import.meta.url),
      target: "references/absolute-bans.md",
      title: "absolute-bans.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pattern-examples",
      source: new URL("./references/pattern-examples.md", import.meta.url),
      target: "references/pattern-examples.md",
      title: "pattern-examples.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "quick-checklist",
      source: new URL("./references/quick-checklist.md", import.meta.url),
      target: "references/quick-checklist.md",
      title: "quick-checklist.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "review-output-format",
      source: new URL("./references/review-output-format.md", import.meta.url),
      target: "references/review-output-format.md",
      title: "review-output-format.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "review-type-modifiers",
      source: new URL("./references/review-type-modifiers.md", import.meta.url),
      target: "references/review-type-modifiers.md",
      title: "review-type-modifiers.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for frontend-design-review.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
