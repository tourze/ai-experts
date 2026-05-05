import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const speckitReviewerSkill = defineSkill({
  id: "speckit-reviewer",
  fullName: "Speckit Reviewer",
  description: "当用户要审查 Spec Kit 实现代码、变更 diff、缺陷风险、安全问题或测试缺口时使用。",
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
      summary: "Eval cases for speckit-reviewer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
