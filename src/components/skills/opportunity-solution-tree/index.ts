import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const opportunitySolutionTreeSkill = defineSkill({
  id: "opportunity-solution-tree",
  fullName: "机会解决方案树",
  description: "当用户要搭建机会解决方案树、把目标与机会、方案和实验串起来时使用；适合连续发现、需求排序和产品探索决策。",
  useCases: [
    "产品探索、连续发现、OKR 拆解、机会排序和实验规划。",
    "需要把目标与版本规划、PRD 连接起来时，可配合 [create-prd](../create-prd/SKILL.md)。",
  ],
  constraints: [
    "树顶必须是单一且可度量的 outcome，不能把功能目标写在最上面。",
    "Opportunity 要从用户问题或欲望出发，不要直接写解决方案。",
    "每条分支最终都应落到可验证实验，而不是停在“以后做”。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
