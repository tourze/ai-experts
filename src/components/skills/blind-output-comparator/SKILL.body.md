在不知道输出来源的前提下比较两个结果，降低对 skill、模型、作者或实现方式的偏见。适用于 skill eval、prompt A/B、模型输出比较和人工评审前的结构化初筛。

## 适用场景

- 有两个标记为 A / B 的输出，需要判断哪个更好完成原始任务。
- 需要根据任务动态生成 rubric，而不是套固定评分表。
- expectations 可用但不完整，需要同时看整体质量和断言通过率。
- 两个输出都失败或都不错时，需要选择“失败更轻”或“边际更好”的一方。

## 核心约束

- 保持盲评：不要推断 A / B 来自哪个 skill、模型或作者。
- 主要依据是任务完成度和输出质量；expectations 只是次要证据。
- Rubric 必须由原始任务生成，至少覆盖内容质量和结构可用性两类。
- 除非两个输出确实等价，否则要果断选择 A 或 B；平局应少见。
- reasoning 必须具体说明胜者强在哪里、败者差在哪里。

## 代码模式

盲评输出保持 JSON，便于后续 analyzer 读取：

```json
{
  "winner": "A",
  "reasoning": "输出 A 覆盖了全部验收项，并给出可执行命令；输出 B 只有概念说明，缺少验证路径。",
  "rubric": {
    "A": {
      "content_score": 4.7,
      "structure_score": 4.3,
      "overall_score": 9
    },
    "B": {
      "content_score": 3,
      "structure_score": 2.7,
      "overall_score": 5.7
    }
  },
  "output_quality": {
    "A": {
      "score": 9,
      "strengths": ["结论完整", "证据可追溯"],
      "weaknesses": ["少量格式不一致"]
    },
    "B": {
      "score": 6,
      "strengths": ["结构可读"],
      "weaknesses": ["缺少验证命令", "关键风险未覆盖"]
    }
  }
}
```

## 检查清单

- [ ] 已读取两个输出的完整内容；输出为目录时检查所有相关文件。
- [ ] 已从原始任务提炼应产出什么、质量维度是什么、失败标准是什么。
- [ ] Rubric 同时覆盖 correctness / completeness / accuracy 和 organization / formatting / usability。
- [ ] 如有 expectations，已统计通过率，但没有用它替代整体判断。
- [ ] winner 为 `A`、`B` 或 `TIE`，且 reasoning 足以复核。

## 反模式

### FAIL: 按来源偏好选择

```
我知道 A 来自新 skill，所以 A 更可能正确。
```

盲评阶段不允许使用来源信息。

### PASS: 只按输出本身比较

```text
A 覆盖任务要求的 5 个交付物，B 只覆盖 3 个；
A 的命令可运行，B 的命令缺少参数。
winner = A
```

### FAIL: 固定 rubric 不看任务

```
所有任务都按“语气、长度、结构”评分。
```

代码修复、PDF 填表、研究报告需要完全不同的质量维度。

### PASS: 任务专属 rubric

```text
PDF 表单：字段对齐、文本可读性、数据完整性。
技术方案：正确性、约束覆盖、迁移风险、验证路径。
```
