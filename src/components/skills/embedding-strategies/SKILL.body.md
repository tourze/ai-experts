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
