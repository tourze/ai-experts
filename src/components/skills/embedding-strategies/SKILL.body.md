## 代码模式

```json
{
  "task": "rag",
  "embedding_model": "text-embedding-3-large",
  "distance": "cosine",
  "chunk_size": 800,
  "chunk_overlap": 120,
  "metadata_fields": ["doc_id", "section", "language"]
}
```

```text
文档 -> 清洗 -> 分块 -> 向量化 -> 索引 -> 检索 -> 重排/生成
```

## 检查清单

- 目标任务是否明确：搜索、推荐、RAG、代码检索、多语种检索。
- 是否同时记录了维度、延迟、价格、最大上下文、距离度量。
- chunk 大小与 overlap 是否基于文档结构，而不是拍脑袋。

## 反模式

### FAIL: 看榜单选模型

```
"MTEB 榜单第一是 voyage-large-2，换上！"
→ 上线后中文 FAQ 召回反而下降 12%
→ 榜单是英文通用语料，业务是中文领域文本
```

### PASS: 自建评测集再选

```
1. 从真实日志抽 200 条 query + 标注正确文档
2. 对 3 个候选模型跑 recall@5 / mrr
3. 同时记录单价、维度、p95 延迟
→ 选 recall 不是最高、但成本/延迟都达标的那个
```

### FAIL: 只调 chunk size

```
召回差 → chunk 800 改 1200 → 没改善 → 再改 1600
→ 实际问题：query 是短问句、文档是长技术文，需要 hybrid + 重排
```

### PASS: 分层归因

```
1. 看 query 分布（短 vs 长、关键词 vs 语义）
2. 看文档结构（章节、表格、代码）
3. 决定 chunk 策略 + 是否加 BM25 + 是否加 reranker
```
