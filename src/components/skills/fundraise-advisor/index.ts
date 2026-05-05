import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const fundraiseAdvisorSkill = defineSkill({
  id: "fundraise-advisor",
  fullName: "融资顾问",
  description: "当用户要准备融资、理清轮次策略、准备投资人沟通或梳理融资故事时使用；适用于 pre-seed 到 seed 阶段的筹资准备与节奏管理。",
  useCases: [
    "规划融资窗口、目标轮次、投资人名单、会前材料和跟进节奏。",
    "需要展开完整方法时，阅读 [references/full-guide.md](references/full-guide.md)。",
    "需要市场规模支撑时配合 [market-sizing-analysis](../market-sizing-analysis/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "full-guide",
      source: new URL("./references/full-guide.md", import.meta.url),
      target: "references/full-guide.md",
      title: "full-guide.md",
      summary: "Reference material for fundraise-advisor.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
