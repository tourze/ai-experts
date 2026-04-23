# 商务蓝 Corporate Blue

## 适用场景
大企业季度/年度汇报、董事会演示、投资人沟通、集团内部述职。

## 色彩系统
```yaml
colors:
  primary: "#1B3A5C"
  secondary: "#2E6EA6"
  accent: "#E8A838"
  background: "#FFFFFF"
  card_bg: "#F4F7FA"
  text_primary: "#1A1A2E"
  text_secondary: "#5A6978"
  chart_colors: ["#1B3A5C", "#2E6EA6", "#E8A838", "#4CAF93", "#7B8FA1", "#C75B3A"]
```

## 排版系统
```yaml
typography:
  heading_font: "Arial"
  body_font: "Arial"
  cjk_font: "微软雅黑"
  sizes:
    title: 44
    subtitle: 28
    heading: 24
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
  card_border_radius: 0.08
  card_shadow: "outer, blur:4, offset:2, opacity:0.08"
  card_gap: 0.3
  card_bg: "#F4F7FA"
```

## page_rhythm 建议
```yaml
rhythm:
  cover: anchor
  problem: dense
  solution: breathing
  data: dense
  comparison: dense
  quote: breathing
  ending: anchor
```

## 反模式
- 不要用高饱和度的荧光色或渐变背景，这会破坏专业感
- 不要在封面放超过两个 logo（公司 logo + 客户 logo 足够）
- 不要使用圆角过大的卡片或圆形裁剪的图表，保持直角或微圆角
- 不要用 bounce/spin 动画，仅用 fade 和 appear
- 不要把金色 accent 用于大面积背景，仅用于关键数据高亮和分隔线
