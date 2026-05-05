import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const ragAuditorSkill = defineSkill({
  id: "rag-auditor",
  description: "当用户要审计 RAG 管线、排查 retrieval failure、groundedness、hallucination、chunking、top-k 或生成答案不忠实时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rag-auditor.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
