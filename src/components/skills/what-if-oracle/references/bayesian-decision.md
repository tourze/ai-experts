
# 贝叶斯决策分析

## 适用场景

- 用户在“要不要做 / 先做哪个 / 投多少资源 / 是否进入下一阶段”之间犹豫，并且风险、证据和行动代价都不确定。
- 需要把松散信息转成 `intake -> evidence -> update -> action -> sensitivity -> report` 的可审计闭环。
- 输入不完整但仍要先给弱先验、最小追问和下一步信息收集动作。
- 如果只是轻量待办排序，转 [priority-judge](../../priority-judge/SKILL.md)；如果只做未来分支推演，先用 [what-if-oracle](../SKILL.md)。
- 如果只要求解释贝叶斯定理、解概率作业、泛泛发散想法，或要求最终持牌医疗/法律/投资建议，不使用本 skill。

## 核心约束

- 输出是决策报告，不是公式秀；先给人话结论和行动建议，再给证据链。
- 先完成 intake：明确决策问题、假设、时间窗口、成功指标、候选行动和风险容忍度。
- 每条证据都标 `observed`、`estimated` 或 `assumed`，并说明等级、方向、独立性和限制。
- prior 可以是弱定性判断、区间或数字；只有来源、参考类和等效强度足够清楚时才给精确数字。
- update 必须解释“信念为什么改变”，不能把低质量证据塞进高精度后验。
- action 阶段必须落到行动、放弃条件、重开判断条件和下一步最有价值信息。
- sensitivity 必须检查关键假设变化后结论是否翻转；不稳定时优先建议低成本试点或补证据。
- 高风险领域只能给 decision support，不能替代持牌专业意见。

## 执行流程

1. 读取 [decision contract](./decision-contract.md)，先把用户请求压成一个 decision brief。
2. 建立 prior：写参考类、来源强度、置信层级和最可能出错的地方。
3. 建 evidence map：按证据等级、方向、独立性和观测/估计/假设分类。
4. 做 update：用自然语言、区间或轻量数字说明 prior 如何变成 posterior。
5. 做 action mapping：比较候选行动、阈值、下行和可逆性，给当前建议。
6. 读取 [prior hygiene](./prior-hygiene.md)，只选本案最相关的 `3-5` 条判断卫生检查。
7. 输出 report：结论、行动、证据、信念变化、敏感性、下一步信息和重开条件。

## 代码模式

```json
{
  "decision_question": "",
  "hypothesis": "",
  "time_horizon": "",
  "success_metric": "",
  "actions": [],
  "prior": {
    "belief": "weak | moderate | strong | numeric-if-justified",
    "reference_class": "",
    "strength": "weak | moderate | strong"
  },
  "evidence_items": [],
  "posterior": {
    "belief": "",
    "why_changed": ""
  },
  "action_recommendation": {},
  "sensitivity": {},
  "prior_hygiene": []
}
```

## 检查清单

- [ ] 决策问题、假设、时间窗口、成功指标和候选行动已写清。
- [ ] prior 的参考类、来源强度和不确定性已说明。
- [ ] 证据没有混淆事实、估计和假设；弱证据没有支撑强结论。
- [ ] 已说明信念变化路径，而不是只给一个后验数字。
- [ ] 建议动作包含阈值、放弃条件、重开条件和下一步信息。
- [ ] 已做敏感性检查，并标注结论为 `stable`、`mixed` 或 `unstable`。
- [ ] prior hygiene 只展示本案最相关的 `3-5` 条，并说明它们如何改变行动强度。

## 反模式

| 反模式 | 后果 | 替代 |
|--------|------|------|
| 只报“后验 63%” | 用户不知道做什么 | 概率后接行动、阈值和重开条件 |
| 3 个用户喜欢 -> 直接重投入 | 小样本被过度更新 | 标弱先验，下一步收集预订/押金/点击 |
| 不做敏感性 | 结论靠单个假设撑着 | 写清转化率、CAC 或下行成本到什么点会翻转 |
