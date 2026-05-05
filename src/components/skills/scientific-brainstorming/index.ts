import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const scientificBrainstormingSkill = defineSkill({
  id: "scientific-brainstorming",
  fullName: "科学脑暴",
  description: "当需要围绕研究问题做科学脑暴、跨学科联想、实验设计探索、方法创新或假设生成时使用。",
  useCases: [
    "用户要找研究方向、跨学科连接、方法创新或潜在研究空白。",
    "适合课题早期、概念阶段、实验设计探索阶段。",
    "用户需要的是共创式发散，而不是教科书式讲解。",
    "如果要借其他行业或学科的成熟机制，可结合 [cross-pollination-engine](../cross-pollination-engine/SKILL.md)。",
    "如果要先拆掉既有假设，再重建研究问题，可结合 [first-principles-decomposer](../first-principles-decomposer/SKILL.md)。",
    "需要更结构化方法时，参考 [brainstorming_methods.md](references/brainstorming_methods.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "brainstorming-methods",
      source: new URL("./references/brainstorming_methods.md", import.meta.url),
      target: "references/brainstorming_methods.md",
      title: "brainstorming_methods.md",
      summary: "Reference material for scientific-brainstorming.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
