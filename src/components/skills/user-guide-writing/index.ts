import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const userGuideWritingSkill = defineSkill({
  id: "user-guide-writing",
  description: "当用户要编写面向最终用户的使用指南、教程、上手手册、FAQ 或帮助中心内容时使用。该技能强调任务导向、截图规划和低门槛表达。",
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
      summary: "Eval cases for user-guide-writing.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
