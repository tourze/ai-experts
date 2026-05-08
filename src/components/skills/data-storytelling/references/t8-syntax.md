# T8 语法：结构化叙事文本标注

T8 是一种内联标注语法，用于在自然语言文本中嵌入机器可读的实体标注。适合文章、专题页、报告摘要的数据驱动叙事场景。

> 来源：旧 narrative-text-visualization 流程，已合并到 data-storytelling。

## 核心约束

- 先拿到清晰的事实与结论，再写 T8；T8 是表达层，不是分析替代品。
- 所有实体标注都必须能回指明确对象：指标、组织、地区、时间、结论、风险。
- 内容应先保证可读性，再补语义标注，不要为了标注破坏自然语言。
- 如果真正需要的是图表 dashboard 而不是文本叙事，用 [data-visualization](../../data-visualization/SKILL.md)。

## 基础语法

```text
收入[+18%](type=growth, unit=%) 主要来自华东区域[企业客户](type=segment)扩张。
```

标注格式：`[显示文本](key=value, key=value)`

## 常用标注类型

| 类型 | 用途 | 示例 |
|------|------|------|
| `growth` | 增长指标 | `[+18%](type=growth, unit=%)` |
| `risk` | 风险信号 | `[-4%](type=risk, unit=%)` |
| `segment` | 客户/市场细分 | `[企业客户](type=segment)` |
| `time` | 时间范围 | `[2026 Q1](type=time)` |
| `region` | 地理区域 | `[华东](type=region)` |
| `metric` | 指标名称 | `[DAU](type=metric)` |

## 段落组织

```md
## 核心结论
收入[+18%](type=growth)，但增长质量分化

## 增长来源
- 新客 LTV[+22%](type=growth)：高质量企业客户驱动

## 隐藏风险
- 续费率[-4%](type=risk)：老客承压，需追溯流失
```

一段一个主结论 + 支撑数据点。

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

每段一个 headline，支撑数据点紧跟其后。
