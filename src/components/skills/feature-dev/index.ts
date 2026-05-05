import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const featureDevSkill = defineSkill({
  id: "feature-dev",
  description: "当用户要实现跨多文件、跨模块或存在架构取舍的新功能时使用。单文件小改或纯 bug 修复不需要。",
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
      summary: "Eval cases for feature-dev.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
