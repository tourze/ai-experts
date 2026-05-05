import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const designingGrowthLoopsSkill = defineSkill({
  id: "designing-growth-loops",
  description: "当用户要设计增长飞轮、邀请推荐、内容供给循环、产品驱动获客、留存复利，或分析 S 曲线增长阶段、跨越鸿沟策略、PLG 产品自服务增长就绪度时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "crossing-the-chasm",
      source: new URL("./references/crossing-the-chasm.md", import.meta.url),
      target: "references/crossing-the-chasm.md",
      title: "crossing-the-chasm.md",
      summary: "Reference material for designing-growth-loops.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Reference material for designing-growth-loops.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "plg-readiness",
      source: new URL("./references/plg-readiness.md", import.meta.url),
      target: "references/plg-readiness.md",
      title: "plg-readiness.md",
      summary: "Reference material for designing-growth-loops.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "s-curve-growth",
      source: new URL("./references/s-curve-growth.md", import.meta.url),
      target: "references/s-curve-growth.md",
      title: "s-curve-growth.md",
      summary: "Reference material for designing-growth-loops.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for designing-growth-loops.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
