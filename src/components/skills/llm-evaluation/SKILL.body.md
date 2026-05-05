## 适用场景

- 需要回答“这个 LLM 应用到底有没有变好”，而不是只看单次样例。
- 需要比较不同模型、不同 prompt、不同 agent 流程的质量差异。
- 需要建立离线样本集、评分 rubric、回归报警与上线门槛。
- 相关 skill：[prompt-engineering-patterns](../prompt-engineering-patterns/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。

## 核心约束

- 先定义任务成功标准，再谈指标；没有目标函数的 evaluation 没有意义。
- 自动指标、人工评审、LLM-as-judge 各有盲点，至少要两种视角交叉验证。
- 回归测试必须使用冻结样本集，避免一边改题一边看分数。
- 评估报告必须区分“统计显著”“业务显著”“可上线”三个层级。

## 代码模式

```json
{
  "dataset": "support-faq-v3",
  "metrics": ["accuracy", "format_compliance", "latency"],
  "pass_threshold": {
    "accuracy": 0.9,
    "format_compliance": 0.98,
    "latency_ms_p95": 2500
  }
}
```

```python
from statistics import mean

scores = [0.8, 1.0, 0.9]
avg_score = mean(scores)
print(round(avg_score, 4))
```

## 检查清单

- 样本集是否覆盖主路径、边界条件、失败样例和拒答样例。
- 评分标准是否可复现，是否区分了硬约束和软偏好。
- 是否保留了基线模型/基线 prompt 的分数用于对比。
- 如果问题集中在 prompt 设计，是否交给 [prompt-engineering-patterns](../prompt-engineering-patterns/SKILL.md) 进一步拆解。
- 如果问题集中在检索链路，是否交给 [rag-auditor](../rag-auditor/SKILL.md)。

## 反模式

### FAIL: 3 个样例替代 benchmark

```
“挑了 3 个复杂问题测试，都答对了”
→ 样本偏向支持结论，不代表真实分布
```

### PASS: 冻结评测集 + 多指标

```
dataset = “support-faq-v3”  # 200 样本，覆盖主路径/边界/拒答
metrics = [“accuracy”, “format_compliance”, “latency_p95”]
→ 对比基线分数，而不是看单次
```

### FAIL: 只看平均分

```
accuracy 0.92 → “达标”
→ 实际：主路径 0.98，边界 0.65，长尾 0.3
```

### PASS: 按类别拆分

```
| 类别 | 样本 | accuracy |
|------|------|----------|
| 主路径 | 100 | 0.98 |
| 边界 | 60 | 0.65 ← 关注 |
| 拒答 | 40 | 0.85 |
```

### FAIL: 样本集随版本改

```
v2 低 → 改 prompt 又改样本 → v3 高
→ 分数永远涨，实际不知道有没有回归
```

### PASS: 冻结基线

```
v1_frozen_200.yaml 永不修改
新版本对同一样本集跑分，对比 v1 基线
```
