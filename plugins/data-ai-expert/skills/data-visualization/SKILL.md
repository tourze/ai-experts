---
name: data-visualization
description: 当用户要选择图表类型、生成 Python 可视化代码、调整图表表达方式，或希望把分析结果做成更清晰的图形展示时使用。
user-invocable: false
---

# data-visualization

## 适用场景

- 需要把表格结果转成 line/bar/scatter/heatmap 等图表。
- 用户并不缺数据，缺的是“该画什么图”和“怎么画得清楚”。
- 需要给图表加注释、颜色策略、数值标签、可访问性约束。
- 相关 skill：[data-analysis](../data-analysis/SKILL.md)、[statistical-analysis](../statistical-analysis/SKILL.md)、[data-storytelling](../data-storytelling/SKILL.md)。

## 核心约束

- 先回答“图要表达什么关系”，再选图；不要先有图型偏好。
- 同一张图只承载一个主问题：趋势、对比、分布、相关，不要混搭。
- 默认优先 2D、少颜色、少装饰、可读标签；除非有强理由，不用 3D、双轴、彩虹色。
- 统计不确定性没有被解释清楚前，不要用图表强化虚假的确定性。

## 代码模式

```python
import matplotlib.pyplot as plt

months = ["2026-01", "2026-02", "2026-03"]
revenue = [120, 135, 128]

fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(months, revenue, marker="o", linewidth=2)
ax.set_title("Monthly Revenue")
ax.set_xlabel("Month")
ax.set_ylabel("Revenue")
ax.grid(alpha=0.2)
plt.tight_layout()
plt.show()
```

```python
import matplotlib.pyplot as plt

categories = ["A", "B", "C"]
values = [42, 30, 18]

fig, ax = plt.subplots(figsize=(7, 4))
bars = ax.bar(categories, values)
ax.bar_label(bars, padding=3)
ax.set_title("Category Comparison")
plt.tight_layout()
plt.show()
```

## 检查清单

- 图表类型是否与问题匹配：趋势/对比/分布/相关。
- 轴标签、单位、标题、图例是否完整。
- 颜色是否真的传递信息，而不是纯装饰。
- 是否需要把统计边界、异常点说明同步给 [statistical-analysis](../statistical-analysis/SKILL.md)。
- 如果图表最终要用于汇报，是否把 headline 与故事顺序同步给 [data-storytelling](../data-storytelling/SKILL.md)。

## 反模式

### FAIL: 6 系列折线 + 双 Y 轴

```python
ax.plot(x, revenue, label='Revenue')  # 左轴 $
ax.plot(x, users, label='Users')       # 左轴混
ax2 = ax.twinx()
ax2.plot(x, churn_rate, label='Churn %')  # 右轴 %
# 6 条线 2 个轴 → 用户 5 秒读不出主信息
```

### PASS: 一图一问题

```python
# 只回答："收入趋势怎么样"
fig, ax = plt.subplots()
ax.plot(months, revenue, marker='o')
ax.set_title('Monthly Revenue ($k)')
ax.bar_label(bars, fmt='$%dk')
# 留存、流失另起一张图，各自 own 一个故事
```

### FAIL: 颜色是唯一编码

```python
plt.scatter(x, y, c=['red', 'green', 'blue', 'orange', 'purple'])
# 色盲用户只看到深浅渐变，无法区分类别
```

### PASS: 颜色 + 形状 + 标签

```python
markers = ['o', 's', '^', 'D', 'P']
for i, group in enumerate(groups):
    plt.scatter(x[i], y[i], marker=markers[i], label=group, alpha=0.7)
plt.legend()
# 即使打印成黑白，也能区分类别
```
