# 极简灰 Minimal Gray

## 适用场景
技术分享、产品发布会、开发者大会、内部技术评审、设计工作坊。

## 色彩系统
```yaml
colors:
  primary: "#2D2D2D"
  secondary: "#6B6B6B"
  accent: "#0066FF"
  background: "#FAFAFA"
  card_bg: "#FFFFFF"
  text_primary: "#1A1A1A"
  text_secondary: "#808080"
  chart_colors: ["#0066FF", "#2D2D2D", "#A0A0A0", "#FF6B35", "#00B894", "#C4C4C4"]
```

## 排版系统
```yaml
typography:
  heading_font: "Inter"
  body_font: "Inter"
  cjk_font: "Noto Sans SC"
  sizes:
    title: 48
    subtitle: 24
    heading: 22
    body: 18
    caption: 14
    footnote: 11
  line_height: 1.6
```

## 卡片与布局
```yaml
layout:
  canvas: "16:9"
  safe_area: 0.6
  grid_columns: 12
  card_border_radius: 0.12
  card_shadow: "outer, blur:8, offset:2, opacity:0.06"
  card_gap: 0.35
  card_bg: "#FFFFFF"
```

## page_rhythm 建议
```yaml
rhythm:
  cover: breathing
  problem: breathing
  solution: breathing
  data: dense
  comparison: dense
  quote: breathing
  ending: anchor
```

## 反模式
- 不要加多余的装饰线、纹理或渐变，极简风靠留白和对齐说话
- 不要用超过两种字重（Regular + Semibold），三种即显杂
- 不要在纯灰背景上叠浅灰卡片导致层次消失，确保至少 3:1 对比度
- 不要放占位图标或装饰性插图，无内容的视觉元素一律删除
- accent 蓝仅用于 CTA 和关键高亮，出现频率不超过每页 1-2 处
