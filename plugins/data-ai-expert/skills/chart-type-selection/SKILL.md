---
name: chart-type-selection
description: 当用户要为某组数据选择图表类型、做图表选型决策、判断什么时候该用线图/柱图/饼图/热力图/漏斗等时使用。适合"这组数据该画什么图""为什么不用饼图""Dashboard 该放哪些图"等场景。
---

# 图表类型选型

## 适用场景

- 数据已有，不知道画哪种图最能说明问题。
- 审查现有 Dashboard，判断哪些图选错了类型。
- 把"数据形状 → 图表类型"规则内化成选型矩阵。
- 与 [data-visualization](../data-visualization/SKILL.md) 联动：本 skill 解决"画什么"，它解决"怎么画"。

## 核心约束

- **先问问题，后选图**：图表回答 趋势/对比/构成/分布/相关/流转 六类问题之一。
- 类别数 > 15 时禁用柱图/饼图，改 Top-N 或表格。
- 饼图禁用于 > 5 片或切片差异 < 5%——永远输给横向柱图。
- 3D 图、双 Y 轴默认禁用（真实三维数据除外）。
- 颜色不能是唯一编码维度，必须配合形状、标签或图案。
- > 1000 数据点考虑 Canvas / 降采样，避免 SVG 卡死。

## 实施步骤

### 步骤 1：把问题归类

| 问题 | 触发词 | 首选 |
|---|---|---|
| 趋势 | 趋势、增长、时间 | Line / Area |
| 对比 | 对比、排行、谁多 | Bar (横向) / Column |
| 构成 | 占比、组成、share | Stacked Bar / Treemap |
| 分布 | 分布、区间、频率 | Histogram / Box plot |
| 相关 | 关联、相关性、回归 | Scatter / Bubble |
| 流转 | 漏斗、转化、路径 | Funnel / Sankey |

### 步骤 2：过否决规则

归类后**先过 [references/chart-decision-matrix.md](references/chart-decision-matrix.md) 的禁用清单**，再从剩余候选里挑最简单的。

### 步骤 3：给可访问性兜底

每张图附 a11y fallback（数据表 / CSV 下载 / `aria-label` 摘要）。

## 代码模式

### FAIL：6 类别、5% 差异仍然用饼图

```python
plt.pie([38,19,14,12,10,7], labels=['Chrome','Safari','Edge','Firefox','Opera','Other'])
```

→ 角度难比较、标签挤边、不能排序、无色盲兜底。

### PASS：降级为横向柱图 + 降序 + 值标签

```python
data = sorted([('Chrome',38),('Safari',19),('Edge',14),
               ('Firefox',12),('Opera',10),('Other',7)], key=lambda x: x[1])
labels, values = zip(*data)
bars = ax.barh(labels, values)
ax.bar_label(bars, fmt='%d%%', padding=3)
ax.spines[['top','right']].set_visible(False)
```

→ 长度比面积易比较；降序让排行一目了然；值标签让精确值不依赖刻度。

## 验证清单

- [ ] 明确图回答的是 趋势/对比/构成/分布/相关/流转 哪一类。
- [ ] 类别数 ≤ 15；未用 3D、未用双 Y 轴、未把饼图用于 > 5 片。
- [ ] 颜色不是唯一信息通道（配形状/标签/图案）。
- [ ] 数据量匹配渲染方案（> 1k 考虑 Canvas；> 10k 必须聚合）。
- [ ] 附 a11y 兜底：标题 + 数据表或 CSV。

## 反模式

- 饼图做 8 品类占比。
- 折线连接类别型 x 轴（产品 A/B/C），伪造连续性。
- 6 系列 + 双 Y 轴，用户要先解码轴再读数据。
- 色阶排序却不给数值标签，色盲不可用。
- Dashboard 堆 20 张图——一个问题一张图是硬约束。

## 参考资料

- [references/chart-decision-matrix.md](references/chart-decision-matrix.md) — 12 类数据形状 × 推荐图 × 禁用清单 × a11y 等级
- [data-visualization](../data-visualization/SKILL.md)
- [data-storytelling](../data-storytelling/SKILL.md)
- [statistical-analysis](../statistical-analysis/SKILL.md)
