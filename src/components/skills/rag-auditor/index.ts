import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const ragAuditorSkill = defineSkill({
  id: "rag-auditor",
  fullName: "rag-auditor",
  description: "当用户要审计 RAG 管线、排查 retrieval failure、groundedness、hallucination、chunking、top-k 或生成答案不忠实时使用。",
  useCases: [
    "用户说“RAG 效果不稳定”“为什么总答非所问”“检索命中了但生成没用上”。",
    "需要分层回答：问题出在 query、chunk、embedding、index、retrieval、rerank、prompt 还是 generation。",
    "需要构造评测集、定义 retrieval/generation 指标并输出改进优先级。",
    "相关资源：[references/retrieval-metrics.md](references/retrieval-metrics.md)、[references/generation-metrics.md](references/generation-metrics.md)、[references/failure-taxonomy.md](references/failure-taxonomy.md)、[references/diagnostic-queries.md](references/diagnostic-queries.md)、[evals/cases.yaml](evals/cases.yaml)。",
    "相关 skill：[embedding-strategies](../embedding-strategies/SKILL.md)、[similarity-search-patterns](../similarity-search-patterns/SKILL.md)、[vector-index-tuning](../vector-index-tuning/SKILL.md)、[llm-evaluation](../llm-evaluation/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "diagnostic-queries",
      source: new URL("./references/diagnostic-queries.md", import.meta.url),
      target: "references/diagnostic-queries.md",
      title: "diagnostic-queries.md",
      summary: "Reference material for rag-auditor.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "failure-taxonomy",
      source: new URL("./references/failure-taxonomy.md", import.meta.url),
      target: "references/failure-taxonomy.md",
      title: "failure-taxonomy.md",
      summary: "Reference material for rag-auditor.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "generation-metrics",
      source: new URL("./references/generation-metrics.md", import.meta.url),
      target: "references/generation-metrics.md",
      title: "generation-metrics.md",
      summary: "Reference material for rag-auditor.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "retrieval-metrics",
      source: new URL("./references/retrieval-metrics.md", import.meta.url),
      target: "references/retrieval-metrics.md",
      title: "retrieval-metrics.md",
      summary: "Reference material for rag-auditor.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
