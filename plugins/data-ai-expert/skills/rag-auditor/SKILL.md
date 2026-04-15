---
name: rag-auditor
description: 当用户要审计 RAG 管线质量或排查检索与生成链路故障时使用。
---

# rag-auditor

## 适用场景

- 用户说“RAG 效果不稳定”“为什么总答非所问”“检索命中了但生成没用上”。
- 需要分层回答：问题出在 query、chunk、embedding、index、retrieval、rerank、prompt 还是 generation。
- 需要构造评测集、定义 retrieval/generation 指标并输出改进优先级。
- 相关资源：[references/retrieval-metrics.md](references/retrieval-metrics.md)、[references/generation-metrics.md](references/generation-metrics.md)、[references/failure-taxonomy.md](references/failure-taxonomy.md)、[references/diagnostic-queries.md](references/diagnostic-queries.md)、[evals/cases.yaml](evals/cases.yaml)。
- 相关 skill：[embedding-strategies](../embedding-strategies/SKILL.md)、[similarity-search-patterns](../similarity-search-patterns/SKILL.md)、[vector-index-tuning](../vector-index-tuning/SKILL.md)、[llm-evaluation](../llm-evaluation/SKILL.md)。

## 核心约束

- 先把 retrieval 和 generation 分开看，不要把所有锅都甩给“大模型”。
- 评测 query 必须覆盖主路径、易混淆路径、长尾失败样例。
- 改进建议必须能落到具体层：chunk、embedding、索引、重排、prompt、answer synthesis。
- 如果没有证据链，就不要直接宣布“模型 hallucination”。

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

## 检查清单

- 是否已经拿到 query、gold docs、模型输出、引用片段或日志。
- retrieval 与 generation 的指标是否分开统计。
- 失败样例是否能映射到 [references/failure-taxonomy.md](references/failure-taxonomy.md)。
- 如果怀疑 embedding 或索引问题，是否联动 [embedding-strategies](../embedding-strategies/SKILL.md) 与 [vector-index-tuning](../vector-index-tuning/SKILL.md)。
- 如果最终要纳入回归，是否同步到 [llm-evaluation](../llm-evaluation/SKILL.md)。

## 反模式

- 看到错误答案就默认是 hallucination，不看检索证据。
- retrieval 指标差，却只改回答 prompt。
- generation 指标差，却一味调索引参数。
- 没有样本集和失败归类，就输出一长串泛泛建议。
