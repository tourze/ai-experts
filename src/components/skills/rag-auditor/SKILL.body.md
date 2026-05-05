## 代码模式

```text
RAG 审计顺序:
1. 定义 query set
2. 评估 retrieval@k
3. 评估 grounded answer
4. 分类失败原因
5. 给出 P0/P1/P2 改进建议
```

```json
{
  "retrieval_metrics": ["precision_at_k", "recall_at_k", "mrr"],
  "generation_metrics": ["groundedness", "completeness", "hallucination_rate"]
}
```
