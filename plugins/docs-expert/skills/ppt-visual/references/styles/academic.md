# 学术风 Academic

## 适用场景
论文答辩、学术会议报告、研究课题汇报、教学课件、实验成果展示。

## 色彩系统
```yaml
colors:
  primary: "#2C3E50"
  secondary: "#34698B"
  accent: "#C0392B"
  background: "#FFFFFF"
  card_bg: "#F5F6F8"
  text_primary: "#1C1C1C"
  text_secondary: "#5D6D7E"
  chart_colors: ["#2C3E50", "#34698B", "#C0392B", "#27AE60", "#8E6BBF", "#E67E22"]
```

## 排版系统
```yaml
typography:
  heading_font: "Arial"
  body_font: "Arial"
  cjk_font: "宋体"
  sizes:
    title: 40
    subtitle: 24
    heading: 22
    body: 18
    caption: 14
    footnote: 11
  line_height: 1.5
```

## 卡片与布局
```yaml
layout:
  canvas: "16:9"
  safe_area: 0.5
  grid_columns: 12
  card_border_radius: 0.04
  card_shadow: "none"
  card_gap: 0.25
  card_bg: "#F5F6F8"
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
- 不要用花哨的过渡动画，学术场景只用 appear 和 fade
- 不要在数据图上叠文字说明——图和解释分区放置，保持图表可读性
- 不要用深色或渐变背景，学术场景默认白底，投影清晰度优先
- 不要把参考文献堆在正文页，单独放一页或用 footnote
- 不要用品牌化 CTA 按钮或营销术语，保持中性、客观的表达
- CJK 正文用宋体保证学术感，标题可用黑体/微软雅黑增加层次
