## 代码模式

```json
{
  "index": "hnsw",
  "m": 32,
  "ef_construction": 200,
  "ef_search": 80,
  "objective": "balance_recall_and_latency"
}
```

```text
调优顺序:
1. 固定评测集
2. 固定 embedding 与距离度量
3. 记录基线 recall / p95 latency / memory
4. 单变量调参
5. 回归验证
```
