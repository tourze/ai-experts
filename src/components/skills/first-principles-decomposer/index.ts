import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const firstPrinciplesDecomposerSkill = defineSkill({
  id: "first-principles-decomposer",
  description: "当需要用第一性原理拆解事实层、识别隐含假设、重建问题边界、从零推导方案时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for first-principles-decomposer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
