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

## 反模式

### FAIL: 单次查询拍板

```
"我本地查了一下，120ms，可以！"
→ 上线后 p95 800ms
→ 单次查询不暖 cache、不并发、不代表流量分布
```

### PASS: 固定 benchmark

```
benchmark.py:
- 1000 条真实抽样 query
- warmup 100 次后开始计时
- 记录 p50/p95/p99 + recall@10
- 每轮调参对比同一份基线
```

### FAIL: 同时改三个参数

```
一次 PR：换 embedding + 换 cosine 为 dot + ef_search 50→200
→ 召回掉了 8%，无法归因到底是哪个变量
```

### PASS: 单变量调参

```
基线 → 只改 ef_search → 记录 recall/latency 曲线 → 选最佳点
→ 再单独评估是否需要换 distance
→ embedding 切换走独立评测周期
```

### FAIL: 用压缩掩盖向量质量差

```
召回差 → 加 PQ 压缩希望"提速换召回"
→ 实际向量本身就分不开类，压缩后更糟
```

### PASS: 先排除上游问题

```
压缩前先确认：未压缩的 flat index 召回率达标吗？
不达标 → 回到 embedding-strategies 修向量
达标但慢 → 才进入 HNSW/PQ 压缩讨论
```
