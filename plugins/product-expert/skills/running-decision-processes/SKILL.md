---
name: running-decision-processes
description: 当用户要推进高风险决策、解决分析瘫痪、对齐多方意见或建立 DACI/RAPID 等决策机制时使用；帮助把模糊争论变成可执行流程。
---

# 决策流程

## 适用场景
- 多方分歧、迟迟无法拍板、需要明确决策人和输入边界。
- 需要补充经验参考时可阅读 [references/guest-insights.md](references/guest-insights.md)。
- 做失败预演或不确定性规划时，可配合 [pre-mortem-analyst](../pre-mortem-analyst/SKILL.md) 与 [planning-under-uncertainty](../planning-under-uncertainty/SKILL.md)。

## 核心约束
- 先定义决策问题、影响范围、不可逆程度和 deadline，再设计流程。
- 明确谁提供输入、谁决策、谁执行，避免“所有人都参与所以没人负责”。
- 决策需要记录理由与前提，方便日后复盘，不是只留一个结论。

## 代码模式
```markdown
问题 -> 备选项 -> 决策标准 -> 角色分工 -> 决策时间点 -> 复盘条件
```

## 检查清单
- [ ] 决策问题、选项和标准已写清。
- [ ] 角色分工、输入边界和最终责任人明确。
- [ ] 已定义做出决定的时间点和所需证据。
- [ ] 结论、理由和后续动作可被追踪。

## 反模式
- 用无限讨论替代决策。
- 没有标准，只比较谁声音更大。
- 事后只记结果，不记当时依据。
