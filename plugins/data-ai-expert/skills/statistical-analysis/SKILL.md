---
name: statistical-analysis
description: 当用户要做统计分析或判断统计结论是否站得住时使用。
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

### FAIL: 只看均值

```
"用户平均停留 5 分钟，挺好"
→ 实际：80% 用户 30 秒离开，20% 鲸鱼用户拉高均值
→ 应该看分位数和分布
```

### PASS: 分布 + 分位数

```
p50 = 0.5 min, p90 = 12 min, p99 = 45 min
→ 看出双峰分布 → 拆分流量类型再分析
```

### FAIL: 显著 = 重要

```
"p < 0.01，差异显著，赶紧上线！"
→ 实际差异：1.2% → 1.21% (0.01 个点)
→ 样本量大到几乎任何差异都显著
```

### PASS: 同时报效应量

```
"差异 +0.01pp，p<0.01，95% CI [+0.005, +0.015]"
→ 业务方可判断：相对于实施成本，这个提升是否值得
```

### FAIL: 相关 = 因果

```
"开通会员的用户留存高 40%"
→ 推断："让所有用户开会员"
→ 实际：会员是高意愿用户的自选择，不是干预
```

### PASS: 区分观测与因果

```
1. 标注：这是观测相关性，不是 ATE
2. 想要因果 → 设计 RCT 或差分中差分
3. 不能做实验 → 至少做倾向得分匹配
```
