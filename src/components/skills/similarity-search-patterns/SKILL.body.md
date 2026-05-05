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
