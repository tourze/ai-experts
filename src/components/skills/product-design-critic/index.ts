import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const productDesignCriticSkill = defineSkill({
  id: "product-design-critic",
  description: "当用户要批判性审视软件产品界面、交互流程、信息层级、信任感或治理暴露时使用（产品策略级设计审视）。像素级 UI 实现质量审查用 `frontend-design-review`；交互可用性启发式诊断用 `ux-heuristics`。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "idea-validator",
      source: new URL("./references/idea-validator.md", import.meta.url),
      target: "references/idea-validator.md",
      title: "idea-validator.md",
      summary: "Reference material for product-design-critic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "industry-anti-patterns",
      source: new URL("./references/industry-anti-patterns.md", import.meta.url),
      target: "references/industry-anti-patterns.md",
      title: "industry-anti-patterns.md",
      summary: "Reference material for product-design-critic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pitch-deck-reviewer",
      source: new URL("./references/pitch-deck-reviewer.md", import.meta.url),
      target: "references/pitch-deck-reviewer.md",
      title: "pitch-deck-reviewer.md",
      summary: "Reference material for product-design-critic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "product-naming",
      source: new URL("./references/product-naming.md", import.meta.url),
      target: "references/product-naming.md",
      title: "product-naming.md",
      summary: "Reference material for product-design-critic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for product-design-critic.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
