import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const errorHandlingPatternsSkill = defineSkill({
  id: "error-handling-patterns",
  description: "在需要设计异常传播、Result 风格错误、局部降级、重试边界和错误分层时使用。语言无关的通用错误处理规范。",
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
      summary: "Eval cases for error-handling-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
