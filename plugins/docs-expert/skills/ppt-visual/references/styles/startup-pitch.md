# 创业路演 Startup Pitch

## 适用场景
VC 融资路演、Demo Day、加速器汇报、创业大赛、产品 MVP 展示。

## 色彩系统
```yaml
colors:
  primary: "#4F46E5"
  secondary: "#7C3AED"
  accent: "#10B981"
  background: "#FFFFFF"
  card_bg: "#F5F3FF"
  text_primary: "#111827"
  text_secondary: "#6B7280"
  chart_colors: ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#7C3AED", "#06B6D4"]
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
    body: 20
    caption: 16
    footnote: 12
  line_height: 1.5
```

## 卡片与布局
```yaml
layout:
  canvas: "16:9"
  safe_area: 0.5
  grid_columns: 12
  card_border_radius: 0.14
  card_shadow: "outer, blur:8, offset:2, opacity:0.10"
  card_gap: 0.3
  card_bg: "#F5F3FF"
```

## page_rhythm 建议
```yaml
rhythm:
  cover: anchor
  problem: breathing
  solution: anchor
  data: dense
  comparison: breathing
  quote: breathing
  ending: anchor
```

## 反模式
- 不要超过 12 页（10 页最佳），投资人注意力有限
- 不要在一页上放超过 3 个数据点，关键指标做大、次要指标口述
- 不要用小字和密集表格展示财务模型，放一张增长曲线 + 口头补充
- 不要把团队照片做成六宫格缩略图——核心成员 3-4 人大头照 + 一句话背景
- 不要忘记最后一页放联系方式和明确的 ask（融多少、用来做什么）
- accent 绿仅用于正向指标（增长率、用户数），红色仅用于痛点和竞品短板
