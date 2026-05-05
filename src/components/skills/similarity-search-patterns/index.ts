import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const similaritySearchPatternsSkill = defineSkill({
  id: "similarity-search-patterns",
  fullName: "similarity-search-patterns",
  description: "当用户要实现 semantic search、向量检索、相似度匹配、hybrid search、metadata filters、reranking 或检索架构设计时使用。",
  useCases: [
    "需要从“文本转向量”一路落到“如何存、如何查、如何扩展”。",
    "需要比较 Pinecone、Qdrant、pgvector、Weaviate 等实现路线。",
    "需要设计过滤条件、hybrid search、召回策略或多租户检索结构。",
    "相关 skill：[embedding-strategies](../embedding-strategies/SKILL.md)、[vector-index-tuning](../vector-index-tuning/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。",
  ],
  constraints: [
    "先确定任务目标和数据规模，再决定是精确检索还是 ANN。",
    "距离度量必须与 embedding 模型假设一致；cosine、dot product、L2 不能乱换。",
    "metadata filter、tenant isolation、hybrid ranking 往往和索引结构同级重要。",
    "方案选择时要同时看写入模式、更新频率、召回要求、成本和运维复杂度。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
