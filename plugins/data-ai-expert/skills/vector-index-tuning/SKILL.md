---
name: vector-index-tuning
description: 当用户要调优 HNSW、IVF、PQ、量化、召回-延迟-内存权衡，或排查向量索引性能问题时使用。英文触发词包括 vector index tuning、HNSW、quantization、recall、latency、memory。
---

# vector-index-tuning

## 适用场景

- 检索结果“够准但太慢”，或“够快但召回掉得离谱”。
- 需要选择 HNSW / IVF / PQ / DiskANN 一类索引或量化路线。
- 需要围绕 `M`、`efConstruction`、`efSearch`、压缩率、内存占用做取舍。
- 相关 skill：[similarity-search-patterns](../similarity-search-patterns/SKILL.md)、[embedding-strategies](../embedding-strategies/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。

## 核心约束

- 优化目标要先排序：优先保延迟、保召回还是省内存。
- 调索引参数前先冻结 embedding、distance metric 和评测集。
- 所有调参必须依赖固定 benchmark，不接受“感觉更快了”。
- 如果真正的问题在 chunking 或 embedding 质量，不要误用索引参数掩盖。

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

## 检查清单

- 是否定义了基线 recall、p95 latency、内存占用和写入成本。
- 是否保证每轮只改一个主要参数。
- benchmark query 是否与真实线上流量接近。
- 如果质量问题来自向量本身，是否切换到 [embedding-strategies](../embedding-strategies/SKILL.md)。
- 如果问题已经扩散到整条 RAG 链路，是否交给 [rag-auditor](../rag-auditor/SKILL.md)。

## 反模式

- 不看 benchmark，只看单次本地查询速度。
- 同时改 embedding、distance、index 参数，最后无法归因。
- 追求极限低延迟，却不记录召回损失。
- 用索引压缩去掩盖上游向量质量差的问题。
