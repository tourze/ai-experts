import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const designingGrowthLoopsSkill = defineSkill({
  id: "designing-growth-loops",
  fullName: "设计增长飞轮",
  description: "当用户要设计增长飞轮、邀请推荐、内容供给循环、产品驱动获客、留存复利，或分析 S 曲线增长阶段、跨越鸿沟策略、PLG 产品自服务增长就绪度时使用。",
  useCases: [
    "产品已有一定留存基础，想把拉新、激活、留存和分享串成闭环。",
    "需要结合 [references/guest-insights.md](references/guest-insights.md) 提炼常见增长模式或限制条件。",
  ],
  constraints: [
    "先确认核心用户价值和自然传播时刻，再设计分享或邀请机制。",
    "飞轮必须说明输入、产出、反馈路径与放大条件，不能只是一张漏斗图。",
    "如果留存、LTV 或用户价值不足，优先修产品基础，而不是强推裂变。",
  ],
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
  ],
});
