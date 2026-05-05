import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const concurrencyPatternsSkill = defineSkill({
  id: "concurrency-patterns",
  description: "当需要设计或审查并发/异步代码时使用。语言无关的通用并发原则：不阻塞、限制并发、传播取消、不共享可变状态、超时所有外部调用。",
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
      summary: "Eval cases for concurrency-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
