import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { embeddingStrategiesSkill } from "../embedding-strategies/index";
import { ragAuditorSkill } from "../rag-auditor/index";
import { vectorIndexTuningSkill } from "../vector-index-tuning/index";

export const similaritySearchPatternsSkill = defineSkill({
  id: "similarity-search-patterns",
  fullName: "similarity-search-patterns",
  description: "当用户要实现 semantic search、向量检索、相似度匹配、hybrid search、metadata filters、reranking 或检索架构设计时使用。",
  useCases: [
    "需要从“文本转向量”一路落到“如何存、如何查、如何扩展”。",
    "需要比较 Pinecone、Qdrant、pgvector、Weaviate 等实现路线。",
    "需要设计过滤条件、hybrid search、召回策略或多租户检索结构。",
  ],
  constraints: [
    "先确定任务目标和数据规模，再决定是精确检索还是 ANN。",
    "距离度量必须与 embedding 模型假设一致；cosine、dot product、L2 不能乱换。",
    "metadata filter、tenant isolation、hybrid ranking 往往和索引结构同级重要。",
    "方案选择时要同时看写入模式、更新频率、召回要求、成本和运维复杂度。",
  ],
  checklist: [
    "检索目标是搜索、推荐还是 RAG。",
    "向量维度、距离度量、索引类型是否一致。",
    "是否明确了过滤条件、排序规则、重排策略与更新频率。",
  ],
  relatedSkills: [
    {
      get id() {
        return vectorIndexTuningSkill.id;
      },
      reason: "如果问题主要在性能与召回权衡，是否转给 `vector-index-tuning`。",
    },
    {
      get id() {
        return embeddingStrategiesSkill.id;
      },
      reason: "检索问题指向模型选择、chunking、metadata 或距离度量前置设计时联动。",
    },
    {
      get id() {
        return ragAuditorSkill.id;
      },
      reason: "需要把检索与生成链路一起审计或纳入 RAG 回归时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只比品牌不比 workload",
      pass: "按 workload 决策",
    }),
    defineAntiPattern({
      fail: "换模型不动距离",
      pass: "模型 + 距离 + 索引一起换",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "设计语义检索、向量检索、hybrid search、metadata filters、reranking 和多租户检索架构。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确定检索目标、数据规模、写入/更新频率、召回要求、延迟预算、租户隔离和成本约束。",
      "确认 embedding 维度、distance metric、top_k、索引类型和过滤条件一致；模型、距离和索引不能孤立替换。",
      "根据 workload 选择 pgvector、Qdrant、Pinecone、Weaviate 等路线；同时设计 metadata filter、hybrid ranking 和 rerank。",
      "用真实 query 和 gold set 验证 recall、precision、latency 与过滤正确性；性能调参转 vector-index-tuning。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "检索架构方案：engine、distance、top_k、index、metadata filters、tenant isolation 和 rerank。",
      "写入/更新模式、成本、运维复杂度和扩展路径取舍。",
      "召回/准确性/延迟验证结果，以及需要上游 embedding 或下游 RAG 审计的信号。",
    ],
  }),
  tools: [],
});
