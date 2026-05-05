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
