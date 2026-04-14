---
name: pre-mortem-analyst
description: 当用户要做事前验尸、上线前风险推演或从“假设已经失败”出发找致命问题时使用；适合项目、产品、发布与战略决策的失败预演。
---

# 事前验尸

## 适用场景
- 发布前、项目启动前、重大决策前的失败路径推演。
- 需要参考 [references/framework.md](references/framework.md) 与 [references/examples.md](references/examples.md)。
- 与决策或不确定性分析联动时，可配合 [running-decision-processes](../running-decision-processes/SKILL.md) 和 [planning-under-uncertainty](../planning-under-uncertainty/SKILL.md)。

## 核心约束
- 先假设项目已经失败，再倒推原因；不要在头脑风暴阶段就自我辩护。
- 风险要落到可触发的具体情景，而不是“市场不好”这类空泛说法。
- 输出必须给出预防动作、监控指标和责任归属。

## 代码模式
```markdown
| 失败原因 | 早期信号 | 预防动作 | 应急动作 |
| --- | --- | --- | --- |
```

## 检查清单
- [ ] 已列出至少一组高概率/高影响失败路径。
- [ ] 每条风险都有早期信号与对应动作。
- [ ] 已区分可预防、可缓解和只能接受的风险。
- [ ] 结论能反向影响当前计划与资源分配。

## 反模式
- 把 pre-mortem 做成泛泛风险登记表。
- 只列问题，不给触发信号和对策。
- 为了“积极氛围”而回避真正致命的问题。
