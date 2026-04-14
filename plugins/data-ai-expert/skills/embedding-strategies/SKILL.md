---
name: embedding-strategies
description: 当用户要为语义搜索、RAG、向量检索选择 embedding 模型、切块策略、评估方式，或比较不同 embedding 方案时使用。英文触发词包括 embedding model、chunking、semantic search、retrieval quality。
---

# embedding-strategies

## 适用场景

- 需要在“效果、成本、维度、语言覆盖、领域适配”之间为 embedding 选型。
- 需要定义 chunk size、chunk overlap、metadata 策略与 query/document 双塔约束。
- 检索召回差，但还不能确认问题出在 embedding、切块还是索引层。
- 相关 skill：[similarity-search-patterns](../similarity-search-patterns/SKILL.md)、[vector-index-tuning](../vector-index-tuning/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。

## 核心约束

- 先定任务，再选模型：FAQ 检索、长文档问答、代码检索、多语种检索的最优解不一样。
- embedding 方案必须和距离度量、索引类型、chunk 规则一起设计，不能单独讨论。
- 文档切块要优先尊重语义边界，其次再谈 token 上限。
- 检索质量要通过离线样本评估，不要凭主观感觉认定某个模型“更懂业务”。

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
- 是否已经把质量问题与 [vector-index-tuning](../vector-index-tuning/SKILL.md) 和 [similarity-search-patterns](../similarity-search-patterns/SKILL.md) 分层拆开。
- 若最终目标是 RAG，可把整条链路交给 [rag-auditor](../rag-auditor/SKILL.md) 做回归评估。

## 反模式

- “某家模型榜单分高，所以一定适合我们的语料”。
- 没有标注集或评测样本，就宣布 embedding 升级成功。
- 只调 chunk size，不看 query 分布、文档结构和重排层。
- 把索引延迟问题误判为 embedding 质量问题。
