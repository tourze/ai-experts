# 贝叶斯决策报告契约

## 目标

把不确定选择变成可复盘的证据到行动报告。报告可以使用定性、区间或数字；数字只在输入质量足够时使用。

## 1. Intake

必须先补齐：

| 字段 | 说明 |
|------|------|
| `decision_question` | 现在要做的具体选择 |
| `hypothesis` | 主要行动成立必须为真的命题 |
| `time_horizon` | 判断有效的时间窗口 |
| `success_metric` | 事后判断成败的指标 |
| `actions` | 至少两个候选行动，最好含“低成本测试 / 等待 / 放弃” |
| `risk_tolerance` | 低 / 中 / 高，以及不可承受下行 |
| `decision_deadline` | 何时必须做决定，没有就写“可滚动” |

缺字段时不要伪装完整。先给弱先验和 `1-3` 个最高价值追问。

## 2. Prior

prior 需要记录：

- `reference_class`：最接近的可比案例。
- `belief`：弱 / 中 / 强，或有依据的概率区间。
- `source_strength`：参考类来源和等效强度。
- `stale_risk`：历史经验是否可能过期。
- `could_be_wrong_if`：什么事实会推翻这个先验。

不要从模型直觉直接跳到精确数字。没有参考类时只能写弱先验。

## 3. Evidence Map

| 字段 | 说明 |
|------|------|
| `claim` | 证据支持或反对的命题 |
| `source` | 来源或观测方式 |
| `status` | `observed` / `estimated` / `assumed` |
| `grade` | `A` / `B` / `C` / `D` / `E` |
| `direction` | `supports` / `weakens` / `mixed` |
| `independence` | `independent` / `overlap` / `same-source` |
| `limit` | 样本、偏差、依赖或过期风险 |

证据等级：

| 等级 | 典型来源 | 用法 |
|------|----------|------|
| `A` | 官方统计、系统综述、审计数据、强实验 | 可支撑强更新 |
| `B` | 同类 benchmark、公开数据集、可复现实验 | 可支撑中等更新 |
| `C` | 内部历史、结构化访谈、小样本行为数据 | 可用但要 caveat |
| `D` | 类比、专家直觉、LLM 建议 | 只能弱更新 |
| `E` | 营销文案、无来源说法、社媒单点 | 不作为核心证据 |

## 4. Update

输出时说明：

- prior 是什么。
- 哪些证据让信念上调、下调或保持。
- 是否存在证据依赖，是否折扣。
- posterior 是定性、区间还是数字。
- `why_changed`：用普通话说明信念变化。

不要求每次写公式；如果写数字，必须说明输入是 observed、estimated 还是 assumed。

## 5. Action Mapping

后验必须映射到行动：

| 字段 | 说明 |
|------|------|
| `recommended_action` | 当前建议 |
| `why_now` | 为什么现在这样做 |
| `why_not_others` | 为什么其他候选行动不优先 |
| `threshold` | 什么条件下行动会翻转 |
| `downside_control` | 如何限制不可逆损失 |
| `reopen_condition` | 何时重开判断 |

如果 top actions 的期望收益接近，建议优先补证据，而不是假装有明确答案。

## 6. Sensitivity

至少检查三类变化：

- prior 更保守 / 更乐观时，建议是否变化。
- 核心证据强度减半时，建议是否变化。
- 下行成本或机会成本上调时，建议是否变化。

稳定性标签：

| 标签 | 含义 | 默认动作 |
|------|------|----------|
| `stable` | 合理变化下建议不变 | 可执行，但保留复盘点 |
| `mixed` | 一两个假设会翻转建议 | 先试点或补关键证据 |
| `unstable` | 多个合理变化都会翻转 | 不做大投入，先收集信息 |

## 7. Report

报告顺序：

1. 一句话结论
2. 当前建议动作
3. Decision Brief
4. Prior
5. Evidence Map
6. Update
7. Action Mapping
8. Sensitivity
9. Prior Hygiene
10. Next Information
11. Caveats

高风险领域必须写明：这是 decision support，不是持牌专业建议。
