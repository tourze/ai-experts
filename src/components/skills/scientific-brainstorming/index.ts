import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const scientificBrainstormingSkill = defineSkill({
  id: "scientific-brainstorming",
  description: "当需要围绕研究问题做科学脑暴、跨学科联想、实验设计探索、方法创新或假设生成时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for scientific-brainstorming.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
