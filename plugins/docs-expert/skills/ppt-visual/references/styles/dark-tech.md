# 暗色科技 Dark Tech

## 适用场景
技术大会主题演讲、AI/ML 产品发布、数据平台展示、网络安全汇报、黑客马拉松。

## 色彩系统
```yaml
colors:
  primary: "#00D4AA"
  secondary: "#6C63FF"
  accent: "#FF6B9D"
  background: "#0D1117"
  card_bg: "#161B22"
  text_primary: "#E6EDF3"
  text_secondary: "#8B949E"
  chart_colors: ["#00D4AA", "#6C63FF", "#FF6B9D", "#FFA657", "#3FB950", "#79C0FF"]
```

## 排版系统
```yaml
typography:
  heading_font: "Inter"
  body_font: "Inter"
  cjk_font: "Noto Sans SC"
  sizes:
    title: 48
    subtitle: 28
    heading: 24
    body: 18
    caption: 14
    footnote: 12
  line_height: 1.6
```

## 卡片与布局
```yaml
layout:
  canvas: "16:9"
  safe_area: 0.5
  grid_columns: 12
  card_border_radius: 0.12
  card_shadow: "outer, blur:12, offset:0, opacity:0.3"
  card_gap: 0.3
  card_bg: "#161B22"
```

## page_rhythm 建议
```yaml
rhythm:
  cover: anchor
  problem: breathing
  solution: breathing
  data: dense
  comparison: dense
  quote: breathing
  ending: anchor
```

## 反模式
- 不要在深色背景上用纯白 (#FFFFFF) 文字，用 #E6EDF3 降低刺眼感
- 不要把多种高亮色同时堆在一页，每页限 1 种 accent + 主色
- 不要用深色渐变叠深色背景导致层级消失，卡片需要明确边界（border 或亮度差）
- 不要用科技感噱头（矩阵雨、地球旋转）替代真实内容，动效限于 fade 和 slide
- 不要忘记投影仪环境暗色效果会变暗，正文字号不低于 18pt，关键数据不低于 36pt
