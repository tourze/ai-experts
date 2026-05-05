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
