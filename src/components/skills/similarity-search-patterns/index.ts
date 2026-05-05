import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const similaritySearchPatternsSkill = defineSkill({
  id: "similarity-search-patterns",
  fullName: "similarity-search-patterns",
  description: "当用户要实现 semantic search、向量检索、相似度匹配、hybrid search、metadata filters、reranking 或检索架构设计时使用。",
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
      summary: "Eval cases for similarity-search-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
