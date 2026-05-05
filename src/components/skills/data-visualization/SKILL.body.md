## 适用场景

- 需要把表格结果转成 line/bar/scatter/heatmap 等图表。
- 用户并不缺数据，缺的是“该画什么图”和“怎么画得清楚”。
- 需要给图表加注释、颜色策略、数值标签、可访问性约束。
- 需要审查现有 Dashboard，判断哪些图选错了类型。
- 需要把"数据形状 → 图表类型"规则内化成选型矩阵。
- 相关 skill：[data-analysis](../data-analysis/SKILL.md)、[statistical-analysis](../statistical-analysis/SKILL.md)、[data-storytelling](../data-storytelling/SKILL.md)。

## 核心约束

- 先回答“图要表达什么关系”，再选图；不要先有图型偏好。
- 同一张图只承载一个主问题：趋势、对比、分布、相关，不要混搭。
- 默认优先 2D、少颜色、少装饰、可读标签；除非有强理由，不用 3D、双轴、彩虹色。
- 统计不确定性没有被解释清楚前，不要用图表强化虚假的确定性。
- 类别数 > 15 时禁用柱图/饼图，改 Top-N 或表格。
- 饼图禁用于 > 5 片或切片差异 < 5%，默认优先横向柱图。
- 颜色不能是唯一编码维度，必须配合形状、标签或图案。

## 代码模式

### 模式 1：选型矩阵

| 问题 | 触发词 | 首选 |
|---|---|---|
| 趋势 | 趋势、增长、时间 | Line / Area |
| 对比 | 对比、排行、谁多 | Bar / Column |
| 构成 | 占比、组成、share | Stacked Bar / Treemap |
| 分布 | 分布、区间、频率 | Histogram / Box plot |
| 相关 | 关联、相关性、回归 | Scatter / Bubble |
| 流转 | 漏斗、转化、路径 | Funnel / Sankey |

归类后先过 [chart-decision-matrix](references/chart-decision-matrix.md) 的禁用清单，再从剩余候选里挑最简单的。

### 模式 2：Python 图表代码

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

### 模式 3：饼图降级

```python
data = sorted([('Chrome', 38), ('Safari', 19), ('Edge', 14),
               ('Firefox', 12), ('Opera', 10), ('Other', 7)], key=lambda x: x[1])
labels, values = zip(*data)
bars = ax.barh(labels, values)
ax.bar_label(bars, fmt='%d%%', padding=3)
ax.spines[['top', 'right']].set_visible(False)
```

## 检查清单

- 图表类型是否与问题匹配：趋势/对比/分布/相关。
- 轴标签、单位、标题、图例是否完整。
- 颜色是否真的传递信息，而不是纯装饰。
- 类别数是否合理，未用 3D、未用双 Y 轴、未把饼图用于 > 5 片。
- 数据量是否匹配渲染方案（> 1k 考虑 Canvas；> 10k 必须聚合）。
- 是否附 a11y 兜底：标题 + 数据表或 CSV。
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

### FAIL: 折线连类别 x 轴

```python
ax.plot(['A', 'B', 'C', 'D'], [10, 20, 30, 25])
# x 轴是无序类别，却暗示 A→D 是连续过程
```

### PASS: 柱图

```python
ax.bar(['A', 'B', 'C', 'D'], [10, 20, 30, 25])
```
