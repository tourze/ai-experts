---
name: narrative-text-visualization
description: 当用户要用 T8 Syntax 把数据洞察写成结构化叙事文本时使用。
---

# narrative-text-visualization

## 适用场景

- 用户想把一组数据洞察输出成“可读的结构化文字可视化”，而不是纯表格或纯图表。
- 需要给文章、专题页、报告摘要添加实体标注和语义化展示。
- 需要生成可嵌入 HTML/React/Vue 的 T8 内容骨架。
- 相关 skill：[data-analysis](../data-analysis/SKILL.md)、[data-storytelling](../data-storytelling/SKILL.md)、[data-visualization](../data-visualization/SKILL.md)。

## 核心约束

- 先拿到清晰的事实与结论，再写 T8；T8 是表达层，不是分析替代品。
- 所有实体标注都必须能回指明确对象：指标、组织、地区、时间、结论、风险。
- 内容应先保证可读性，再补语义标注，不要为了标注破坏自然语言。
- 如果用户真正想要的是图表 dashboard，而不是文本叙事，优先转 [data-visualization](../data-visualization/SKILL.md)。

## 代码模式

```text
# 2026 Q1 经营分析

## 核心结论
收入[+18%](type=growth, unit=%) 主要来自华东区域[企业客户](type=segment)扩张。

## 风险
续费率[-4%](type=risk, unit=%) 说明老客质量承压，需要补看流失原因。
```

```html
<div id="report-root"></div>
<script type="module">
  const content = `# Sales Review\n\nRevenue[+12%](type=growth, unit=%)`;
  console.log(content);
</script>
```

## 检查清单

- 原始事实是否已经确认，是否需要先走 [data-analysis](../data-analysis/SKILL.md)。
- 标题、段落、实体标注是否围绕一个主结论展开。
- 标注类型、单位、时间范围是否前后一致。
- 如果最终要做汇报摘要，是否同步应用 [data-storytelling](../data-storytelling/SKILL.md) 的叙事结构。
- 如果文本中嵌入了图形结论，是否与 [data-visualization](../data-visualization/SKILL.md) 的图表口径一致。

## 反模式

- 拿 T8 去替代事实分析，导致“格式正确、内容失真”。
- 对每个名词都打标，最后文本完全不可读。
- 同时在一段里塞多个主结论，没有层级。
- 把前端实现细节和叙事文本混写到一起。
