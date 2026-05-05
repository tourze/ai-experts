import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
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
      reason: "相关 skill：`embedding-strategies`、`vector-index-tuning`、`rag-auditor`。",
    },
    {
      get id() {
        return ragAuditorSkill.id;
      },
      reason: "相关 skill：`embedding-strategies`、`vector-index-tuning`、`rag-auditor`。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
