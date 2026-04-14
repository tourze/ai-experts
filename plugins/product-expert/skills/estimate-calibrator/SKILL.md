---
name: estimate-calibrator
description: 当用户要做三点估算、工作量校准、PERT 区间或不确定性说明时使用；输出最佳/最可能/最差估算、未知项与置信度说明。
---

# 估算校准

## 适用场景
- 研发排期、路线图沟通、项目承诺、Story points 或任务规模评估。
- 需要参考 [references/estimation-methods.md](references/estimation-methods.md)、[references/sizing-heuristics.md](references/sizing-heuristics.md)、[references/unknown-categories.md](references/unknown-categories.md)。
- 需要验证案例格式时，可查看 [evals/cases.yaml](evals/cases.yaml)。

## 核心约束
- 先拆工作，再估时间；没有边界定义的任务不要直接给单点数值。
- 估算必须显式写出假设、未知项和最坏情况，不允许只报“乐观值”。
- 估算不等于承诺，区间越窄越需要证据支撑。

## 代码模式
```markdown
| 工作项 | Best | Likely | Worst | 主要未知项 |
| --- | --- | --- | --- | --- |
```

## 检查清单
- [ ] 工作已拆到可讨论的不确定性粒度。
- [ ] 已给出三点估算、风险来源和置信度说明。
- [ ] 关键依赖、外部等待和返工概率已纳入。
- [ ] 结果能支撑排期决策，而不是制造虚假确定性。

## 反模式
- 把含糊需求直接估成精确日期。
- 用历史最顺利案例套所有新项目。
- 报一个数字却不说明前提和风险。
