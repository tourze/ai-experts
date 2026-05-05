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
