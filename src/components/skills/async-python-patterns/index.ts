import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const asyncPythonPatternsSkill = defineSkill({
  id: "async-python-patterns",
  fullName: "Python 异步模式",
  description: "当用户要实现 asyncio、async/await、TaskGroup、timeout、cancellation、并发 I/O 或异步 API 时使用。",
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
      summary: "Eval cases for async-python-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
