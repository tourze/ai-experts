import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const embeddingStrategiesSkill = defineSkill({
  id: "embedding-strategies",
  description: "当用户要选择或比较 embedding 模型、切块策略或向量检索方案时使用。",
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
      summary: "Eval cases for embedding-strategies.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
