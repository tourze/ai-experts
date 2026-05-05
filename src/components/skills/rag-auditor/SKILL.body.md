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

## 反模式

### FAIL: 错答直接归因 hallucination

```
"为什么 AI 瞎编？" → "模型 hallucination，换模型"
→ 没看 retrieval 日志，可能是检索根本没命中
```

### PASS: 先看检索证据再定性

```
1. retrieval top-3 是什么 chunk？
2. gold doc 是否在 top-3 里？
   - 否 → retrieval 问题（改 chunk/embedding/rerank）
   - 是但未引用 → generation 问题（改 prompt/模型）
   - 是且引用但错答 → 真 hallucination 或 chunk 切错位置
```

### FAIL: 指标分不清乱调

```
整体差 → 同改 chunk+embedding+prompt+索引
→ 变好不知道谁起作用，变差不知回滚哪个
```

### PASS: 分层单变量诊断

```
Step 1: retrieval@k 差 → 只改 chunking，重测
Step 2: retrieval 好但 groundedness 差 → 只改 prompt，重测
Step 3: groundedness 好但 completeness 差 → 只改 top-k，重测
```
