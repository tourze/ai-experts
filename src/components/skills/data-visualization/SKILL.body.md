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
