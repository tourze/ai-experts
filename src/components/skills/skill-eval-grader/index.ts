import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const skillEvalGraderSkill = defineSkill({
  id: "skill-eval-grader",
  description: "当用户要根据 transcript、outputs 和 expectations 评估一次 skill/eval 执行是否通过，或审查 eval assertions 是否有区分度时使用。",
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
      summary: "Eval cases for skill-eval-grader.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
