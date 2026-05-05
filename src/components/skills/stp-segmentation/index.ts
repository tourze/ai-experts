import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const stpSegmentationSkill = defineSkill({
  id: "stp-segmentation",
  fullName: "STP 市场细分-目标-定位",
  description: "当用户要做 STP 市场细分、选择目标市场、制定市场定位或回答\"该卖给谁\"时使用。",
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
      summary: "Eval cases for stp-segmentation.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
