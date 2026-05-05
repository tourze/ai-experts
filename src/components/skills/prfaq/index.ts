import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const prfaqSkill = defineSkill({
  id: "prfaq",
  fullName: "PRFAQ（新闻稿 + FAQ）",
  description: "当用户要用 PRFAQ 或 Working Backwards 验证产品想法、对齐团队认知或推动立项时使用。",
  useCases: [
    "新产品/功能立项前，用\"从终点倒推\"的方式验证用户价值主张。",
    "需要在团队或管理层之间对齐\"我们到底要做什么、为谁做\"。",
    "与 [create-prd](../create-prd/SKILL.md) 配合：PRFAQ 先定\"为什么做\"，PRD 再定\"怎么做\"。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
