# 政务正式 Gov Formal

## 适用场景
政府部门工作汇报、政策宣讲、党政学习、公文式演示、领导述职。

## 色彩系统
```yaml
colors:
  primary: "#C41E24"
  secondary: "#8B1A1A"
  accent: "#D4A017"
  background: "#FFFFFF"
  card_bg: "#FBF5F5"
  text_primary: "#1A1A1A"
  text_secondary: "#5C5C5C"
  chart_colors: ["#C41E24", "#D4A017", "#2B5B84", "#4A8C5C", "#8B6B3E", "#6B6B6B"]
```

## 排版系统
```yaml
typography:
  heading_font: "微软雅黑"
  body_font: "微软雅黑"
  cjk_font: "微软雅黑"
  sizes:
    title: 40
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
  card_border_radius: 0.04
  card_shadow: "none"
  card_gap: 0.25
  card_bg: "#FBF5F5"
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
- 不要用外文字体做标题，中文场景统一使用微软雅黑或方正系列
- 不要用过于活泼的配色（荧光绿、粉色），政务场景以红、蓝、金为主色域
- 不要使用卡通插图或 emoji，图形仅限数据图表、组织架构图、流程图
- 不要出现英文缩写或互联网黑话，术语用中文全称
- 不要在封面堆叠过多元素——标题 + 汇报单位 + 日期即可，庄重留白
- 红色仅用于标题和关键强调，大面积红色背景会显得过于喜庆而非正式
