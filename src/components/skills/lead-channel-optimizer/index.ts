import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const leadChannelOptimizerSkill = defineSkill({
  id: "lead-channel-optimizer",
  description: "在需要判断获客渠道优先级、比较 ROI、削减低效投入或重排增长资源时使用。",
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
      summary: "Eval cases for lead-channel-optimizer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
