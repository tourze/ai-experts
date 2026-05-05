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
