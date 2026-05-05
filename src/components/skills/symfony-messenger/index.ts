import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const symfonyMessengerSkill = defineSkill({
  id: "symfony-messenger",
  description: "当用户要设计或修复 Symfony Messenger 异步消息处理、重试、失败队列或消费者时使用。",
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
      summary: "Eval cases for symfony-messenger.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
