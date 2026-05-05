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

### FAIL: 只比品牌不比 workload

```
"听说 Pinecone 最快，就用 Pinecone"
→ 实际：100 万向量 + 重过滤场景，pgvector + HNSW 已足够
→ 多花 $500/月 + 增加一个外部依赖
```

### PASS: 按 workload 决策

```
- 向量数 < 1M、写少读多 → pgvector
- 向量数 > 10M、需要分布式 → Qdrant/Weaviate
- 完全 serverless 优先 → Pinecone
- 必须列出：写入 QPS、查询 QPS、过滤复杂度、租户数
```

### FAIL: 换模型不动距离

```
原：text-embedding-ada-002 + cosine
换：bge-m3，距离仍用 cosine
→ bge-m3 输出未归一化时 cosine 与 dot product 行为不一致
→ 召回莫名下降
```

### PASS: 模型 + 距离 + 索引一起换

```
切换 embedding 时强制 checklist:
1. 模型推荐的距离度量是什么
2. 输出向量是否已归一化
3. 索引参数（M/ef）是否需要重训
```
