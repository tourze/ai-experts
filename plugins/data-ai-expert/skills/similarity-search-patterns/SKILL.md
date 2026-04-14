---
name: similarity-search-patterns
description: 当用户要实现语义搜索、向量数据库检索、nearest neighbor 查询、hybrid search 或检索系统工程方案时使用。英文触发词包括 similarity search、vector database、semantic search、ANN、nearest neighbor。
---

# similarity-search-patterns

## 适用场景

- 需要从“文本转向量”一路落到“如何存、如何查、如何扩展”。
- 需要比较 Pinecone、Qdrant、pgvector、Weaviate 等实现路线。
- 需要设计过滤条件、hybrid search、召回策略或多租户检索结构。
- 相关 skill：[embedding-strategies](../embedding-strategies/SKILL.md)、[vector-index-tuning](../vector-index-tuning/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。

## 核心约束

- 先确定任务目标和数据规模，再决定是精确检索还是 ANN。
- 距离度量必须与 embedding 模型假设一致；cosine、dot product、L2 不能乱换。
- metadata filter、tenant isolation、hybrid ranking 往往和索引结构同级重要。
- 方案选择时要同时看写入模式、更新频率、召回要求、成本和运维复杂度。

## 代码模式

```json
{
  "engine": "pgvector",
  "distance": "cosine",
  "top_k": 10,
  "metadata_filter": {
    "tenant_id": "acme",
    "language": "zh"
  }
}
```

```sql
SELECT id, title
FROM documents
ORDER BY embedding <=> $1
LIMIT 10;
```

## 检查清单

- 检索目标是搜索、推荐还是 RAG。
- 向量维度、距离度量、索引类型是否一致。
- 是否明确了过滤条件、排序规则、重排策略与更新频率。
- 如果问题主要在模型与 chunking，是否转给 [embedding-strategies](../embedding-strategies/SKILL.md)。
- 如果问题主要在性能与召回权衡，是否转给 [vector-index-tuning](../vector-index-tuning/SKILL.md)。

## 反模式

- 只比数据库品牌，不比实际 workload。
- 模型换了，距离度量和索引参数却完全不动。
- 强依赖 metadata filter，却把它当索引外问题处理。
- 把“检索命中错了”和“生成没有利用命中结果”混为一谈。
