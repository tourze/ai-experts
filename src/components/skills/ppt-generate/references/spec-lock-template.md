# Spec Lock 模板

机读执行契约，在阶段 1（需求确认）完成后生成，此后每页 SVG 生成前必须重读。

```yaml
# Spec Lock v1.0

## 画布
canvas: "16:9"            # 10" x 5.625"（960 x 540 SVG 单位）
page_count: 12             # 总页数

## 风格
style_preset: "corporate-blue"
custom_overrides:
  colors:
    primary: "1B3A5C"      # 主色
    secondary: "2E86AB"    # 辅助色
    accent: "F18F01"       # 强调色
    background: "FFFFFF"   # 背景色
    text_primary: "1A1A2E" # 正文色
    text_secondary: "6B7280" # 次要文字色
    chart_colors:          # 图表色系（按顺序使用）
      - "2E86AB"
      - "F18F01"
      - "1B3A5C"
      - "A23B72"
      - "2CA58D"
  typography:
    heading_font: "Inter"          # 标题字体（英文）
    heading_font_zh: "PingFang SC" # 标题字体（中文）
    body_font: "Inter"             # 正文字体（英文）
    body_font_zh: "PingFang SC"    # 正文字体（中文）
    heading_size: 48               # 标题字号（pt）
    subheading_size: 28            # 副标题字号（pt）
    body_size: 18                  # 正文字号（pt）
    caption_size: 14               # 注释字号（pt）

## 观众与目的
audience: "C-level executives"
purpose: "quarterly business review"
tone: "formal, data-driven"
language: "zh-CN"
duration: "20 minutes"             # 预计演讲时长

## 设计规则
rules:
  - 每页最多 5 个信息块
  - 数据图表使用 chart_colors 色系
  - 图标风格：线性
  - 图片：不使用 / 使用 AI 生成 / 使用占位符
  - 动画：仅 fade-in
  - 标题一律左对齐，距顶部 40px
  - 正文行高 1.5 倍
  - 页码置于右下角，封面和结束页不显示

## 页面节奏
rhythm:
  - { page: 1,  type: "cover",      rhythm: "anchor",    message: "主标题与副标题" }
  - { page: 2,  type: "agenda",     rhythm: "breathing", message: "今天要讲的 4 件事" }
  - { page: 3,  type: "section",    rhythm: "anchor",    message: "第一章：市场现状" }
  - { page: 4,  type: "data",       rhythm: "dense",     message: "Q3 营收同比增长 23%" }
  - { page: 5,  type: "comparison", rhythm: "dense",     message: "我们 vs 竞品的 3 项优势" }
  - { page: 6,  type: "quote",      rhythm: "breathing", message: "客户证言" }
  - { page: 7,  type: "section",    rhythm: "anchor",    message: "第二章：产品路线图" }
  - { page: 8,  type: "timeline",   rhythm: "dense",     message: "Q4-Q2 里程碑" }
  - { page: 9,  type: "content",    rhythm: "dense",     message: "三大战略举措" }
  - { page: 10, type: "case-study", rhythm: "dense",     message: "客户 A 案例" }
  - { page: 11, type: "team",       rhythm: "breathing", message: "核心团队介绍" }
  - { page: 12, type: "ending",     rhythm: "anchor",    message: "谢谢 + 联系方式" }
```

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| canvas | 是 | 画布比例，通常 `16:9` 或 `4:3` |
| page_count | 是 | 总页数，与 rhythm 数组长度必须一致 |
| style_preset | 是 | 预设风格名称 |
| custom_overrides.colors | 是 | 至少包含 primary / background / text_primary |
| custom_overrides.typography | 是 | 至少包含 heading_font / body_font / heading_size / body_size |
| audience | 是 | 目标观众描述 |
| purpose | 是 | 演示目的 |
| tone | 是 | 语气风格 |
| language | 是 | 内容语言 |
| rules | 是 | 设计约束规则列表 |
| rhythm | 是 | 每页的类型、节奏和核心信息 |
| duration | 否 | 演讲时长，用于估算每页停留时间 |
| chart_colors | 否 | 图表配色，未指定时从 primary/secondary/accent 派生 |

## 锁定规则

- spec_lock 在用户确认后**不可自动修改**。
- 如需变更，必须重新走阶段 1 确认流程。
- 每页 SVG 生成前必须重读此文件，确保风格一致。
