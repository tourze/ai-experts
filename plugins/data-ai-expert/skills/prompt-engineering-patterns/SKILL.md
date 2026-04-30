---
name: prompt-engineering-patterns
description: 当用户要设计、优化、约束或排查生产 prompt、结构化输出或 few-shot 示例时使用。
---

# prompt-engineering-patterns

## 适用场景

- 需要给生产环境 LLM 设计稳健 prompt，而不是临时试几句。
- 需要解决结构化输出、few-shot、角色设定、错误恢复、长上下文约束。
- Prompt 已经能跑，但一致性、可控性、可维护性不够。
- 相关资源：[assets/prompt-template-library.md](assets/prompt-template-library.md)、[assets/few-shot-examples.json](assets/few-shot-examples.json)、[scripts/optimize-prompt.mjs](scripts/optimize-prompt.mjs)。
- 相关 skill：[prompt-lab](../prompt-lab/SKILL.md)、[llm-evaluation](../llm-evaluation/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。

## 核心约束

- 先明确输出契约，再写自然语言提示；没有 schema 的 prompt 很难稳定。
- few-shot 示例必须与真实任务同分布，示例越多不代表越好。
- Chain-of-thought 只在确实提升正确率时启用；不要把它当默认万能药。
- 如果用户要的是系统化诊断和评测，而不是单一模式建议，优先转 [prompt-lab](../prompt-lab/SKILL.md)。

## 代码模式

```json
{
  "task": "classify_support_ticket",
  "output_schema": {
    "category": "billing | bug | feature",
    "priority": "low | medium | high",
    "reason": "string"
  }
}
```

```text
System:
你是支持工单分类器。只输出 JSON。

User:
根据以下工单内容返回 {category, priority, reason}。
```

```bash
node scripts/optimize-prompt.mjs
```

## 检查清单

- 输出格式是否有明确 schema 或字段定义。
- 是否给了足够但不过量的示例。
- prompt 是否包含边界条件、拒答规则、异常输入处理方式。
- 若要比较不同 prompt 版本，是否交给 [prompt-lab](../prompt-lab/SKILL.md) 和 [llm-evaluation](../llm-evaluation/SKILL.md)。
- 如果 prompt 绑定 RAG，上下游检索问题是否已经交给 [rag-auditor](../rag-auditor/SKILL.md)。

## 反模式

### FAIL: 话术堆砌后临时补 JSON

```
你是专业且聪明的助手，请认真分析，逻辑严密...
[3000 字指令]
最后输出 JSON。
```

→ 模型 30% 概率输出 markdown + 偶尔 JSON。

### PASS: Schema 优先 + 简洁指令

```
System: 你是分类器。只输出 JSON。
User: 根据工单返回 {category: “billing”|”bug”|”feature”, priority: “low”|”med”|”high”, reason: string}
Ticket: {content}
```

### FAIL: few-shot 当知识库

```
[20 个示例 × 500 字] → 上下文窗口爆炸，重点被稀释
```

### PASS: 少而精的覆盖

```
3-5 个示例：主路径 + 边界 + 易混淆反例
```

### FAIL: 措辞修复数据问题

```
“请你非常非常认真，绝对不要出错”
→ 依然幻觉，只是多了客气话
```

### PASS: 结构化约束 + 评测

```
- 结构化输出 + JSON schema 校验
- few-shot 覆盖失败样例
- llm-evaluation 建立回归基线
```
