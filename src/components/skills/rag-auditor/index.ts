import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { embeddingStrategiesSkill } from "../embedding-strategies/index";
import { llmEvaluationSkill } from "../llm-evaluation/index";
import { similaritySearchPatternsSkill } from "../similarity-search-patterns/index";
import { vectorIndexTuningSkill } from "../vector-index-tuning/index";

export const ragAuditorSkill = defineSkill({
  id: "rag-auditor",
  fullName: "RAG 审计",
  description: "当用户要审计 RAG 管线、排查 retrieval failure、groundedness、hallucination、chunking、top-k 或生成答案不忠实时使用。",
  useCases: [
    "用户说“RAG 效果不稳定”“为什么总答非所问”“检索命中了但生成没用上”。",
    "需要分层回答：问题出在 query、chunk、embedding、index、retrieval、rerank、prompt 还是 generation。",
    "需要构造评测集、定义 retrieval/generation 指标并输出改进优先级。",
    "相关资源：[references/retrieval-metrics.md](references/retrieval-metrics.md)、[references/generation-metrics.md](references/generation-metrics.md)、[references/failure-taxonomy.md](references/failure-taxonomy.md)、[references/diagnostic-queries.md](references/diagnostic-queries.md)。",
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
      reason: "检索失败指向索引参数、top-k、过滤或向量库配置时联动。",
    },
    {
      get id() {
        return llmEvaluationSkill.id;
      },
      reason: "需要把 RAG 指标纳入模型或系统回归评测时联动。",
    },
    {
      get id() {
        return embeddingStrategiesSkill.id;
      },
      reason: "失败原因指向 embedding 模型、chunk 表示或语义覆盖时联动。",
    },
    {
      get id() {
        return similaritySearchPatternsSkill.id;
      },
      reason: "需要审查相似度检索策略、过滤、rerank 或混合检索时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先收集 query、gold docs、召回文档、引用片段、模型输出、prompt 和日志；缺证据时不直接定性 hallucination。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "构造覆盖主路径、易混淆路径和长尾样例的 query set，必要时读取 diagnostic-queries reference。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "先评估 retrieval@k、precision/recall/MRR，再评估 groundedness、completeness 和 hallucination rate。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "把失败样例映射到 failure taxonomy，并按 chunk、embedding、索引、重排、prompt、answer synthesis 给 P0/P1/P2 改进优先级。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Query set、gold docs、检索结果、生成答案和证据链覆盖情况。",
      "Retrieval 指标、generation 指标、失败分类和分层根因判断。",
      "P0/P1/P2 改进建议、需要联动的 embedding/index/evaluation skill 和回归评测入口。",
    ],
  }),
  references: [
    defineReference({
      id: "diagnostic-queries",
      source: new URL("./references/diagnostic-queries.md", import.meta.url),
      target: "references/diagnostic-queries.md",
      title: "diagnostic-queries.md",
      summary: "RAG 管线诊断查询集，覆盖主路径、易混淆路径和长尾失败样例。",
      loadWhen: "需要构造 RAG 评测查询集或排查检索失败时读取。",
    }),
    defineReference({
      id: "failure-taxonomy",
      source: new URL("./references/failure-taxonomy.md", import.meta.url),
      target: "references/failure-taxonomy.md",
      title: "failure-taxonomy.md",
      summary: "RAG 管线失败模式分类体系，帮助精确归因检索或生成环节的问题。",
      loadWhen: "需要将 RAG 失败样例映射到具体失败类型时读取。",
    }),
    defineReference({
      id: "generation-metrics",
      source: new URL("./references/generation-metrics.md", import.meta.url),
      target: "references/generation-metrics.md",
      title: "generation-metrics.md",
      summary: "RAG 生成质量指标定义，包括忠实度、完整性、有用性等评测维度。",
      loadWhen: "需要评估或改进 RAG 生成环节质量时读取。",
    }),
    defineReference({
      id: "retrieval-metrics",
      source: new URL("./references/retrieval-metrics.md", import.meta.url),
      target: "references/retrieval-metrics.md",
      title: "retrieval-metrics.md",
      summary: "RAG 检索质量指标定义，包括召回率、精确率、MRR 等评测维度。",
      loadWhen: "需要评估或改进 RAG 检索环节质量时读取。",
    }),
  ],
});
