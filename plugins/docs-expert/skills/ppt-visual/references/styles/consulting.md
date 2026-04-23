# 咨询风 Consulting

## 适用场景
麦肯锡/BCG/贝恩风格提案、战略规划汇报、管理层决策建议、行业研究报告。

## 色彩系统
```yaml
colors:
  primary: "#003366"
  secondary: "#4A7FB5"
  accent: "#D4A843"
  background: "#FFFFFF"
  card_bg: "#F0F3F7"
  text_primary: "#1C1C1C"
  text_secondary: "#4D5A6A"
  chart_colors: ["#003366", "#4A7FB5", "#7BAFD4", "#D4A843", "#6B8E6B", "#8C6B8C"]
```

## 排版系统
```yaml
typography:
  heading_font: "Arial"
  body_font: "Arial"
  cjk_font: "微软雅黑"
  sizes:
    title: 36
    subtitle: 24
    heading: 20
    body: 16
    caption: 14
    footnote: 11
  line_height: 1.4
```

## 卡片与布局
```yaml
layout:
  canvas: "16:9"
  safe_area: 0.5
  grid_columns: 12
  card_border_radius: 0.0
  card_shadow: "none"
  card_gap: 0.2
  card_bg: "#F0F3F7"
```

## page_rhythm 建议
```yaml
rhythm:
  cover: anchor
  problem: dense
  solution: dense
  data: dense
  comparison: dense
  quote: breathing
  ending: anchor
```

## 反模式
- 不要用圆角卡片或阴影，咨询风强调直角边框和纯色色块
- 不要留大面积空白——咨询页天然信息密集，留白靠结构分区而非空页
- 不要用装饰性图标或 emoji，所有图形元素必须承载数据或逻辑
- 不要超过两层缩进的 bullet，用矩阵/框架图替代长列表
- 每页必须有一句行动导向的 takeaway 标题（"应将预算向 X 倾斜"而非"预算分析"）
