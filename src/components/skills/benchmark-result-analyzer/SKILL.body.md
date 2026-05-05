# Benchmark Result Analyzer

把 benchmark 的分数、比较结果和执行 transcript 转成可行动的改进计划。目标不是重新打分，而是回答：为什么赢、为什么输、下一轮最该改什么。

## 适用场景

- 已有 blind comparison、grading、benchmark.json 或多轮运行结果，需要解释模式。
- 需要揭盲后比较胜者 skill 与败者 skill 的结构、资源、脚本和执行路径。
- 需要分析多次运行中稳定失败、稳定通过或异常波动的 expectation。
- 需要把评测结论转成 skill 指令、工具、示例、错误处理或结构改进建议。

## 核心约束

- 不重新替代 comparator 判胜；先理解既有评分和理由，再分析因果。
- 必须读取胜者/败者 skill、transcript、输出和比较结果，不能只看汇总分。
- 改进建议必须绑定可观察失败原因，不能写“优化说明”“补充示例”这类泛化建议。
- 区分 skill 问题、executor 执行问题、eval assertion 问题和任务本身不合理。
- 建议按 impact 排序，优先列最可能改变下一轮胜负的改动。

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

## 检查清单

- [ ] 已读取 comparison / grading / benchmark 汇总，并记录原始胜负判断。
- [ ] 已读取胜者和败者 skill 的 `SKILL.md` 与关键资源文件。
- [ ] 已读取双方 transcript，比较工具使用、失败恢复和指令遵循差异。
- [ ] 已区分稳定模式和单次偶发异常。
- [ ] 每条建议都写清 category、priority、suggestion 和 expected_impact。
- [ ] 明确哪些问题属于 eval 本身，需要修 assertion 而不是修 skill。

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
