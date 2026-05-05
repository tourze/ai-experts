import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const prfaqSkill = defineSkill({
  id: "prfaq",
  fullName: "PRFAQ（新闻稿 + FAQ）",
  description: "当用户要用 PRFAQ 或 Working Backwards 验证产品想法、对齐团队认知或推动立项时使用。",
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
      summary: "Eval cases for prfaq.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
