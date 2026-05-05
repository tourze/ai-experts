import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { embeddingStrategiesSkill } from "../embedding-strategies/index";
import { llmEvaluationSkill } from "../llm-evaluation/index";
import { similaritySearchPatternsSkill } from "../similarity-search-patterns/index";
import { vectorIndexTuningSkill } from "../vector-index-tuning/index";

export const ragAuditorSkill = defineSkill({
  id: "rag-auditor",
  fullName: "rag-auditor",
  description: "当用户要审计 RAG 管线、排查 retrieval failure、groundedness、hallucination、chunking、top-k 或生成答案不忠实时使用。",
  useCases: [
    "用户说“RAG 效果不稳定”“为什么总答非所问”“检索命中了但生成没用上”。",
    "需要分层回答：问题出在 query、chunk、embedding、index、retrieval、rerank、prompt 还是 generation。",
    "需要构造评测集、定义 retrieval/generation 指标并输出改进优先级。",
    "相关资源：[references/retrieval-metrics.md](references/retrieval-metrics.md)、[references/generation-metrics.md](references/generation-metrics.md)、[references/failure-taxonomy.md](references/failure-taxonomy.md)、[references/diagnostic-queries.md](references/diagnostic-queries.md)、[evals/cases.yaml](evals/cases.yaml)。",
  ],
  constraints: [
    "先把 retrieval 和 generation 分开看，不要把所有锅都甩给“大模型”。",
    "评测 query 必须覆盖主路径、易混淆路径、长尾失败样例。",
    "改进建议必须能落到具体层：chunk、embedding、索引、重排、prompt、answer synthesis。",
    "如果没有证据链，就不要直接宣布“模型 hallucination”。",
  ],
  checklist: [
    "是否已经拿到 query、gold docs、模型输出、引用片段或日志。",
    "retrieval 与 generation 的指标是否分开统计。",
    "失败样例是否能映射到 [references/failure-taxonomy.md](references/failure-taxonomy.md)。",
  ],
  relatedSkills: [
    {
      get id() {
        return vectorIndexTuningSkill.id;
      },
      reason: "如果怀疑 embedding 或索引问题，是否联动 `embedding-strategies` 与 `vector-index-tuning`。",
    },
    {
      get id() {
        return llmEvaluationSkill.id;
      },
      reason: "如果最终要纳入回归，是否同步到 `llm-evaluation`。",
    },
    {
      get id() {
        return embeddingStrategiesSkill.id;
      },
      reason: "相关 skill：`embedding-strategies`、`similarity-search-patterns`、`vector-index-tuning`、`llm-evaluation`。",
    },
    {
      get id() {
        return similaritySearchPatternsSkill.id;
      },
      reason: "相关 skill：`embedding-strategies`、`similarity-search-patterns`、`vector-index-tuning`、`llm-evaluation`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "错答直接归因 hallucination",
      pass: "先看检索证据再定性",
    }),
    defineAntiPattern({
      fail: "指标分不清乱调",
      pass: "分层单变量诊断",
    }),
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
