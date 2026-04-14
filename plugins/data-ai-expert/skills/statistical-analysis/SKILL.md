---
name: statistical-analysis
description: 当用户要做描述统计、异常检测、趋势分析、假设检验、相关性解释或判断统计结论是否站得住时使用。英文触发词包括 hypothesis test、outlier、correlation、significance、distribution。
user-invocable: false
---

# statistical-analysis

## 适用场景

- 用户问“这个差异算不算显著”“这个波动算异常吗”“这两个指标真的相关吗”。
- 需要给业务指标补充分布、异常、方差、样本量与统计边界解释。
- 需要对实验、AB、回归观测、趋势变化做更严格的解释。
- 相关 skill：[data-analysis](../data-analysis/SKILL.md)、[data-visualization](../data-visualization/SKILL.md)、[data-storytelling](../data-storytelling/SKILL.md)、[llm-evaluation](../llm-evaluation/SKILL.md)。

## 核心约束

- 先确认数据生成过程和样本口径，再谈统计方法。
- 任何显著性结论都要同时给出效应量或业务影响，不只给 p 值。
- 趋势、相关、因果必须分开表述；统计上相关不代表业务上可行动。
- 数据量太小、偏差太大或采样机制不清楚时，应明确降级结论强度。

## 代码模式

```python
from statistics import mean, median

values = [12, 13, 15, 40]
print(mean(values))
print(median(values))
```

```text
分析顺序:
样本口径 -> 分布/异常 -> 比较/相关 -> 统计边界 -> 业务解释
```

## 检查清单

- 样本量、时间窗口、过滤条件是否明确。
- 是否先看了分布、异常值和缺失值。
- 是否说明了检验方法、假设前提和结论边界。
- 如果需要图表支持，是否同步给 [data-visualization](../data-visualization/SKILL.md)。
- 如果结论要面向业务方表达，是否同步给 [data-storytelling](../data-storytelling/SKILL.md)。

## 反模式

- 只看平均值，不看分布和极端值。
- 把统计显著直接翻译成业务重要。
- 样本量太小还强行下结论。
- 用相关性替代因果解释。
