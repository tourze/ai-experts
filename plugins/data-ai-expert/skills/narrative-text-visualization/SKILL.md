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

### FAIL: 标注满天飞

```
[2026 Q1](type=time)[收入](type=metric)[+18%](type=growth)
主要来自[华东](type=region)[区域](type=region)的[企业](type=segment)
[客户](type=segment)[扩张](type=growth)
→ 文本破碎，人类读起来累
```

### PASS: 只标关键数据点

```
2026 Q1 收入[+18%](type=growth, unit=%) 主要来自
华东区域[企业客户](type=segment)扩张
→ 数字和实体可机读，叙述保留可读性
```

### FAIL: 一段塞多个主结论

```
收入[+18%](growth)、续费率[-4%](risk)、新客 LTV
[+22%](growth)、客服成本[+30%](risk)
→ 没层级，读者不知道哪个是 headline
```

### PASS: 一段一主结论 + 支撑

```md
## 核心结论
收入[+18%](type=growth)，但增长质量分化

## 增长来源
- 新客 LTV[+22%](type=growth)：高质量企业客户驱动
## 隐藏风险
- 续费率[-4%](type=risk)：老客承压，需追溯流失
```
