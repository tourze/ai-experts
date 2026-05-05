import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const firstPrinciplesDecomposerSkill = defineSkill({
  id: "first-principles-decomposer",
  fullName: "第一性原理解构器",
  description: "当需要用第一性原理拆解事实层、识别隐含假设、重建问题边界、从零推导方案时使用。",
  useCases: [
    "用户说“从第一性原理重想”“从头来过”“我们是不是默认了太多”。",
    "现有做法很复杂、很贵，或者“行业都这么做”的理由站不住。",
    "需要挑战既有框架、重新定义问题或重建方案。",
    "分解后可配合 [inversion-strategist](references/inversion-strategist.md) 反推失败路径。",
    "需要借别的行业做类比时，可接 [cross-pollination-engine](../cross-pollination-engine/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "examples",
      source: new URL("./references/examples.md", import.meta.url),
      target: "references/examples.md",
      title: "examples.md",
      summary: "Reference material for first-principles-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "framework",
      source: new URL("./references/framework.md", import.meta.url),
      target: "references/framework.md",
      title: "framework.md",
      summary: "Reference material for first-principles-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "integrated-frameworks",
      source: new URL("./references/integrated-frameworks.md", import.meta.url),
      target: "references/integrated-frameworks.md",
      title: "integrated-frameworks.md",
      summary: "Reference material for first-principles-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "inversion-strategist",
      source: new URL("./references/inversion-strategist.md", import.meta.url),
      target: "references/inversion-strategist.md",
      title: "inversion-strategist.md",
      summary: "Reference material for first-principles-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
