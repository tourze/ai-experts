---
name: prompt-lab
description: 当用户要系统化诊断和优化 prompt 时使用。
---

# prompt-lab

## 适用场景

- 用户不是只想“改一句 prompt”，而是想跑完整的 prompt 诊断与优化流程。
- 需要拆出目标、现状、失败模式、候选变体、评分标准、测试集和下一步实验计划。
- 需要把 prompt 讨论从拍脑袋升级成可复盘的工程流程。
- 相关资源：[references/prompt-patterns.md](references/prompt-patterns.md)、[references/evaluation-metrics.md](references/evaluation-metrics.md)、[references/failure-modes.md](references/failure-modes.md)、[references/output-constraints.md](references/output-constraints.md)、[evals/cases.yaml](evals/cases.yaml)。
- 相关 skill：[prompt-engineering-patterns](../prompt-engineering-patterns/SKILL.md)、[llm-evaluation](../llm-evaluation/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。

## 核心约束

- 先定义任务成功标准，再分析 prompt；没有目标的优化就是随机试错。
- 变体必须是结构化对比：一次只改一个主变量，例如指令清晰度、示例策略、输出约束。
- 评分 rubric 必须包含硬约束和软约束，不要只有“感觉更好”。
- 如果问题本质在检索、数据或工具链，而不是 prompt，本 skill 只负责识别，不负责掩盖。

## 代码模式

```text
目标:
- 用户想让模型完成什么
- 什么结果算通过

当前问题:
- 错误类型
- 复现样例

候选变体:
- Variant A: 改输出约束
- Variant B: 改 few-shot
- Variant C: 改系统角色
```

```text
评分维度:
- correctness: 0-5
- format_compliance: 0-5
- completeness: 0-5
- latency: observation only
```

## 检查清单

- 是否已经读取了与当前任务对应的参考文件。
- 当前 prompt 的失败模式是否已经分类，而不是只收集了零散 bad case。
- 变体之间是否真正可比较。
- 是否已经把评测与回归计划同步到 [llm-evaluation](../llm-evaluation/SKILL.md)。
- 若涉及 RAG，上游检索是否交由 [rag-auditor](../rag-auditor/SKILL.md) 单独排查。

## 反模式

- 用户只让你修一个格式问题，你却展开成完整实验体系。
- 同时改任务定义、示例、输出格式，最后不知道是哪一步生效。
- 只给“更好的 prompt”，不给失败模式和后续验证计划。
- 把模型能力上限问题误判为 prompt 技巧问题。
