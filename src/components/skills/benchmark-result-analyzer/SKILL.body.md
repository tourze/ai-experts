## 代码模式

输出使用结构化 JSON 或同等字段，便于脚本聚合：

```json
{
  "comparison_summary": {
    "winner": "A",
    "comparator_reasoning": "A 的输出可执行且证据完整，B 缺少验证路径"
  },
  "winner_strengths": [
    "工作流步骤明确，executor 没有自行发明流程",
    "包含验证命令，输出前能发现格式错误"
  ],
  "loser_weaknesses": [
    "指令含糊，导致执行时跳过输入确认",
    "没有错误恢复策略，首次命令失败后提前结束"
  ],
  "instruction_following": {
    "winner": { "score": 9, "issues": [] },
    "loser": { "score": 6, "issues": ["未使用 skill 中的检查清单"] }
  },
  "improvement_suggestions": [
    {
      "priority": "high",
      "category": "instructions",
      "suggestion": "把模糊的“处理文档”改成 extract → validate → render 三步",
      "expected_impact": "减少执行路径漂移，直接覆盖本轮失败原因"
    }
  ]
}
```

## 反模式

### FAIL: 分数复述

```
A 9 分，B 6 分，所以 A 更好。建议提升 B。
```

这没有解释可迁移模式，也不能指导下一轮改动。

### PASS: 因果链

```text
B 的 skill 只说“验证输出”，没有指定验证什么；
transcript 显示 executor 只检查文件存在；
grading 失败项正是内容缺失；
建议加入字段级验证清单和失败后修复步骤。
```

### FAIL: 把 eval 问题误判成 skill 问题

```
两个输出都失败，所以两个 skill 都差。
```

也可能是任务缺输入、assertion 无法验证或 benchmark harness 有问题。

### PASS: 分清责任层

```text
expectation 要求“生成准确结论”，但没有给可核对来源；
这是 eval 设计问题，先改 assertion，再比较 skill。
```
