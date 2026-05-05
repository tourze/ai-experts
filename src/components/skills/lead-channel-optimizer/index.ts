import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const leadChannelOptimizerSkill = defineSkill({
  id: "lead-channel-optimizer",
  fullName: "获客渠道优化（lead-channel-optimizer）",
  description: "在需要判断获客渠道优先级、比较 ROI、削减低效投入或重排增长资源时使用。",
  useCases: [
    "渠道很多，但不知道现在该重押哪几个。",
    "需要比较广告、内容、推荐、外联等渠道的效率。",
    "想把预算和团队精力从低效渠道转向更高回报渠道。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
