## 代码模式

评估时保持下面的最小数据结构，方便 benchmark 汇总：

```json
{
  "expectations": [
    {
      "text": "输出包含可复用的测试计划",
      "passed": true,
      "evidence": "outputs/test-plan.md 包含按风险分层的测试矩阵和验收命令"
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 0,
    "total": 1,
    "pass_rate": 1
  },
  "claims": [
    {
      "claim": "所有新增测试均已运行通过",
      "type": "process",
      "verified": false,
      "evidence": "transcript 中没有实际测试命令输出"
    }
  ],
  "eval_feedback": {
    "suggestions": [
      {
        "assertion": "输出包含测试计划",
        "reason": "建议同时检查测试计划是否覆盖失败路径和验收命令"
      }
    ],
    "overall": "assertions 能检查存在性，但对质量区分不足"
  }
}
```

## 反模式

### FAIL: 只看 transcript 自述

```
transcript 说“已生成报告”
→ 直接判定所有 expectations 通过
```

实际输出可能为空、路径错误或内容不符合要求。

### PASS: 读取输出并验证实质内容

```text
outputs/report.md 存在，但只有标题，没有来源与结论。
判定“生成研究报告” FAIL，因为报告缺少任务要求的核心内容。
```

### FAIL: 表层 assertion 制造虚假信心

```
The output mentions "security"
```

任何空泛文本都能通过，无法判断安全审计是否有效。

### PASS: Assertion 绑定可观察结果

```
The output lists at least one concrete auth/data/injection risk with file evidence and mitigation.
```
