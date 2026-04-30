# Prior Hygiene

## 使用方式

Prior hygiene 是判断卫生检查，不是哲学附录。每次只选当前案例最相关的 `3-5` 条，并说明它们如何改变 prior、证据权重、行动强度或下一步信息。

## 检查项

| ID | 原则 | 问题 | 决策影响 |
|----|------|------|----------|
| `base_rate` | 基础率优先 | 类似案例通常怎样？ | 先找参考类，再看个案故事 |
| `small_sample` | 小样本很吵 | 当前证据是否只有一两个样本？ | 降低更新强度，优先补行为数据 |
| `evidence_grade` | 证据有等级 | 证据是观测、估计还是假设？ | 低等级证据不能支撑强结论 |
| `strong_evidence` | 强结论需要强证据 | 行动越大，证据是否越强？ | 大投入、高风险、反常识判断提高门槛 |
| `ruin_risk` | 避免毁灭性风险 | 是否存在不可逆下行？ | 先控下行，再谈期望收益 |
| `causality` | 相关不等于因果 | 证据能支持干预，还是只是共现？ | 因果不足时先做实验 |
| `absence_evidence` | 缺证据也是证据 | 按理应该出现的数据为何没出现？ | 下调信心或列为关键缺口 |
| `reversibility` | 保留可逆选项 | 当前行动能否撤回或分阶段？ | 不确定时优先试点、分阶段、可退出 |
| `disconfirming` | 反面证据最珍贵 | 什么证据会推翻建议？ | 把翻转条件写进下一步信息 |
| `incentives` | 激励会扭曲证据 | 谁希望你相信这个结论？ | 对营销、销售、供应商说法折扣 |
| `stale_prior` | 先验会过期 | 参考类是否来自旧环境？ | 新市场、新渠道、新模型要重校准 |
| `second_order` | 二阶后果 | 行动是否会改变系统本身？ | 检查延迟成本、激励变化和副作用 |

## 选择规则

- 重大投入：优先 `strong_evidence`、`ruin_risk`、`reversibility`。
- 小样本用户研究：优先 `small_sample`、`evidence_grade`、`disconfirming`。
- 市场进入或产品方向：优先 `base_rate`、`stale_prior`、`second_order`。
- 依赖第三方说法：优先 `incentives`、`absence_evidence`、`evidence_grade`。
- 增长、转化、留存判断：优先 `causality`、`small_sample`、`base_rate`。

## 输出格式

```markdown
## Prior Hygiene

1. 基础率优先
   - 触发原因：当前 prior 来自少量访谈，缺少同类项目基准。
   - 决策影响：不直接进入完整开发，先做付费试点。

2. 小样本很吵
   - 触发原因：只有 5 个用户表达兴趣。
   - 决策影响：把“喜欢”降级为弱支持信号，下一步收集真实预订。
```
