import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const opportunitySolutionTreeSkill = defineSkill({
  id: "opportunity-solution-tree",
  description: "当用户要搭建机会解决方案树、把目标与机会、方案和实验串起来时使用；适合连续发现、需求排序和产品探索决策。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for opportunity-solution-tree.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
