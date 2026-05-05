import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pythonErrorHandlingSkill = defineSkill({
  id: "python-error-handling",
  description: "当用户要设计 Python 异常层级、输入校验、部分失败治理或规范 try/except 纪律时使用。",
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
      summary: "Eval cases for python-error-handling.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
