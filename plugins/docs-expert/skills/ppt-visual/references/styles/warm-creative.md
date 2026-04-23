# 暖色创意 Warm Creative

## 适用场景
品牌提案、营销策划汇报、设计评审、创意 brief 展示、线下活动方案。

## 色彩系统
```yaml
colors:
  primary: "#E85D3A"
  secondary: "#F2A93B"
  accent: "#2D7D9A"
  background: "#FFF9F5"
  card_bg: "#FFFFFF"
  text_primary: "#2C2420"
  text_secondary: "#7A6E66"
  chart_colors: ["#E85D3A", "#F2A93B", "#2D7D9A", "#6BBF8A", "#B85C8A", "#D4956B"]
```

## 排版系统
```yaml
typography:
  heading_font: "Helvetica Neue"
  body_font: "Helvetica Neue"
  cjk_font: "Noto Sans SC"
  sizes:
    title: 44
    subtitle: 26
    heading: 22
    body: 18
    caption: 14
    footnote: 12
  line_height: 1.5
```

## 卡片与布局
```yaml
layout:
  canvas: "16:9"
  safe_area: 0.5
  grid_columns: 12
  card_border_radius: 0.16
  card_shadow: "outer, blur:10, offset:3, opacity:0.10"
  card_gap: 0.35
  card_bg: "#FFFFFF"
```

## page_rhythm 建议
```yaml
rhythm:
  cover: anchor
  problem: breathing
  solution: breathing
  data: dense
  comparison: breathing
  quote: breathing
  ending: anchor
```

## 反模式
- 不要让暖色调变成"幼儿园风"——橙红仅做标题和高亮，正文保持深棕色
- 不要每页都放大幅图片，留白页和数据页需要节制视觉重量
- 不要用过于花哨的字体（手写体、艺术字），创意感来自排版节奏而非字体数量
- 不要在暖色背景上叠暖色卡片，确保前景和背景有足够冷暖或明暗对比
- 不要在 B2B 严肃客户面前强行用这套风格，先确认客户文化能接受
