---
name: data-storytelling
description: 当用户需要把数据分析结果面向业务方讲清楚时使用。
---

# data-storytelling

## 适用场景

- 已经有分析结果，但用户真正需要的是“怎么讲清楚”“怎么组织成报告或汇报”。
- 需要把大量指标压缩成 headline、关键洞察、风险、建议、下一步动作。
- 需要给周报、月报、复盘、董事会材料或项目结论页设计叙事顺序。
- 相关 skill：[data-analysis](../data-analysis/SKILL.md)、[data-visualization](../data-visualization/SKILL.md)、[statistical-analysis](../statistical-analysis/SKILL.md)。

## 核心约束

- 先确认“想让谁做什么”，再决定故事结构；没有目标受众就没有叙事。
- 一个故事只保留 1 个主结论和 2 到 4 个支撑点，避免把所有图表原样堆上去。
- 结论必须能回指具体数据证据；需要时引用 [data-analysis](../data-analysis/SKILL.md) 或 [statistical-analysis](../statistical-analysis/SKILL.md) 的结果。
- 建议先写 headline，再补证据，再给行动项，不要反过来。

## 代码模式

```markdown
# 结论先行

## 发生了什么
- 指标 A 环比上升 18%
- 指标 B 同比下降 6%

## 为什么重要
- 这意味着渠道结构正在变化
- 如果不处理，下一周期利润率会继续被压缩

## 建议动作
1. 优先修复转化率最低的入口
2. 继续保留增长最快的高质量渠道
```

```text
主结论 -> 支撑证据 -> 风险边界 -> 决策建议 -> 下一步负责人
```

## 检查清单

- 主结论是否能在 1 句话里说清楚。
- 每个支撑点是否都有数字证据，而不是形容词。
- 是否明确说明了不确定性、样本边界或统计限制。
- 是否知道这份材料最终要驱动哪个动作。
- 如果需要图表，是否把设计要求同步给 [data-visualization](../data-visualization/SKILL.md)。

## 反模式

- 直接把原始 dashboard 截图贴给业务方，假装这就是叙事。
- 用“明显”“显著”“大幅”等词，但不给任何量化证据。
- 把因果、相关、推测混成一句话。
- 为了显得全面，把所有发现都列出来，导致没有主线。
