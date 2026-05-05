# 图表选型决策矩阵

## 12 类数据形状 × 推荐图表

| # | 数据形状 | 关键词 | 首选 | 次选 | 禁用 | 数据量阈值 | a11y 等级 |
|---|---|---|---|---|---|---|---|
| 1 | 时间趋势 | trend, time-series, line | Line | Area, Sparkline | Bar (除非稀疏月度) | < 1k SVG，≥ 1k Canvas+降采样 | AA |
| 2 | 类别对比 | compare, ranking | Bar (横向) | Column | Pie (> 5 片) | < 20 立柱，> 20 横柱或表格 | AAA |
| 3 | 构成 / 占比 | composition, share | Stacked Bar | Treemap, Waffle | Pie > 5 片, Donut 大量 | 总片数 ≤ 7 | AA |
| 4 | 分布 / 频率 | distribution, frequency | Histogram | Box plot, Violin | Line 连接类别点 | bin 数 5-15 | AA |
| 5 | 两变量相关 | correlation, scatter | Scatter | Bubble (+大小) | Line 连散点 | < 5k SVG，≥ 5k Canvas | A |
| 6 | 漏斗 / 转化 | funnel, conversion | Funnel | Stacked Bar | Pie（转化不是构成） | 3-7 步 | A |
| 7 | 流转 / 路径 | flow, sankey, migration | Sankey | Chord, Alluvial | 多层嵌套饼图 | 节点 < 30 | A |
| 8 | 地理分布 | geo, map, region | Choropleth | Symbol Map, Hex Bin | 3D 地球 | 行政粒度合理 | A |
| 9 | 矩阵 / 热力 | heatmap, matrix | Heatmap | Calendar Heatmap | 3D 曲面 | 单元 < 500 | A |
| 10 | 单指标大数字 | metric, KPI, big number | Stat Card | Sparkline + Number | 单数字用饼 | 1 个主值 + 1 个对比 | AAA |
| 11 | 多指标并列对比 | multi-KPI, dashboard | Small Multiples | Bullet Chart | 双 Y 轴 | 3-9 个 panel | AA |
| 12 | 层级结构 | hierarchy, tree | Treemap | Icicle, Sunburst | 多层饼图 | 叶节点 < 200 | A |

## 禁用清单（硬约束）

| 场景 | 禁用图表 | 替代方案 |
|---|---|---|
| 切片 > 5 | Pie, Donut | 横向 Bar 降序 |
| 切片差异 < 5% | Pie | 横向 Bar + 数值标签 |
| 类别 > 15 | Bar, Column, Pie | 表格、Top-10 或搜索 |
| 双指标量纲不同 | 双 Y 轴 Line | Small Multiples（两张图并列） |
| 3 维以下真实数据 | 3D Bar / Pie | 2D 对应图 |
| 类别型 x 轴 | Line（连接点） | Bar / Column |
| 颜色唯一编码 | 彩虹色 Heatmap | 加图案、标签或 Pattern fill |
| 超过 10k 点 | SVG Scatter / Line | Canvas + 降采样 / 聚合 |
| 单一数字对比 | 圆环进度 + 百分比 | Big Number + 上/下箭头对比 |

## 图表库推荐

| 库 | 适合 | 不适合 |
|---|---|---|
| Chart.js | Canvas，通用，轻量 | 复杂自定义，大数据量 |
| Recharts | React，声明式，设计清爽 | > 1 万点、复杂交互 |
| ApexCharts | 交互丰富，SaaS dashboard | 小 bundle |
| ECharts | 大数据 (百万点)、地图、Sankey | TypeScript DX 一般 |
| D3.js | 任意自定义 | 成本高、难维护 |
| Visx (Airbnb) | React + 低层可控 | 文档偏弱 |
| Observable Plot | 快速原型、内部工具 | 生产 dashboard 仍偏新 |
| matplotlib / seaborn | Python，静态出图，报告 | Web 交互 |

## 可访问性兜底清单

每个图表至少满足：

- [ ] 页面能通过 `aria-label` 读到"这张图是什么类型、比较什么"。
- [ ] 色盲友好：不使用红绿二元编码；可用 [ColorBrewer](https://colorbrewer2.org) 的色盲安全板。
- [ ] 关键信息不依赖悬停——数值标签或图例默认可见。
- [ ] 提供"查看数据表"或"下载 CSV"入口。
- [ ] 动效支持 `prefers-reduced-motion`，不做无意义的入场动画。

## Dashboard 组合建议

| 场景 | 组合 |
|---|---|
| 高管 Executive | 4-6 个 Big Number + 1 个主趋势 + 1 个 Top-N 表 |
| 运营实时监控 | Small Multiples × 多指标 + 实时告警面板 |
| 用户行为分析 | 漏斗 + 时间趋势 + Heatmap 段 + Cohort 表 |
| 财务 / 销售 | Big Number + 趋势 Line + 类别 Bar + 预算达成 Bullet |
| 深度钻取 | 主表（Top-N 可点）+ 次图（按点选实体绘制子图） |

## 致谢

本矩阵参考了 `nextlevelbuilder/ui-ux-pro-max-skill` (MIT) 的 charts.csv 数据结构，内容经过重写与精简。
