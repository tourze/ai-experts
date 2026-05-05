## 代码模式

### Schema 优先 + 简洁指令

```text
System: 你是分类器。只输出 JSON。
User: 根据工单返回 {category: "billing"|"bug"|"feature", priority: "low"|"med"|"high", reason: string}
Ticket: {content}
```

### 系统化诊断流程

当用户需要完整诊断（而不是只改一句 prompt）时，按以下结构展开：

```text
目标: 用户想让模型完成什么 / 什么结果算通过

当前问题: 错误类型 + 复现样例

候选变体:
- Variant A: 改输出约束
- Variant B: 改 few-shot
- Variant C: 改系统角色

评分维度:
- correctness: 0-5
- format_compliance: 0-5
- completeness: 0-5
- latency: observation only
```

### 按任务复杂度选粒度

- 小变更（如改输出格式）：直接给 1 行修改 + 验证命令
- 中等优化：3 个候选变体 + 简单 rubric
- 系统重构：完整诊断流程（目标→失败模式→变体矩阵→评分→测试集→实验计划）
