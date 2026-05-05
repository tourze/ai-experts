import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const blindOutputComparatorSkill = defineSkill({
  id: "blind-output-comparator",
  description: "当用户要盲评两个输出版本、比较 A/B 结果质量、生成任务专属 rubric 或避免偏向某个 skill/模型/实现时使用。",
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
      summary: "Eval cases for blind-output-comparator.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
