---
name: prompt-engineering-patterns
description: 当用户要设计、优化、约束或排查 prompt，需要 structured output、few-shot、system prompt、error recovery、prompt template 等模式时使用。英文触发词包括 prompt engineering、prompt template、structured output、few-shot、chain-of-thought。
---

# prompt-engineering-patterns

## 适用场景

- 需要给生产环境 LLM 设计稳健 prompt，而不是临时试几句。
- 需要解决结构化输出、few-shot、角色设定、错误恢复、长上下文约束。
- Prompt 已经能跑，但一致性、可控性、可维护性不够。
- 相关资源：[assets/prompt-template-library.md](assets/prompt-template-library.md)、[assets/few-shot-examples.json](assets/few-shot-examples.json)、[scripts/optimize-prompt.py](scripts/optimize-prompt.py)。
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
python3 scripts/optimize-prompt.py
```

## 检查清单

- 输出格式是否有明确 schema 或字段定义。
- 是否给了足够但不过量的示例。
- prompt 是否包含边界条件、拒答规则、异常输入处理方式。
- 若要比较不同 prompt 版本，是否交给 [prompt-lab](../prompt-lab/SKILL.md) 和 [llm-evaluation](../llm-evaluation/SKILL.md)。
- 如果 prompt 绑定 RAG，上下游检索问题是否已经交给 [rag-auditor](../rag-auditor/SKILL.md)。

## 反模式

- 先堆很多话术，再临时补一个“请输出 JSON”。
- 把 few-shot 当知识库，导致 prompt 变成长文档。
- 不区分系统指令、开发约束、用户输入，所有内容混成一段。
- 只靠“更礼貌”“更强势”的措辞来修复真实的数据或评测问题。
