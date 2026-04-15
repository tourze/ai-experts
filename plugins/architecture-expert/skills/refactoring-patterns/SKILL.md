---
name: refactoring-patterns
description: "在需要使用命名化重构动作改善结构而不改变行为时使用。"
---

# refactoring-patterns

## 适用场景
- 适合需要明确“该用哪个重构动作、按什么顺序做”的情况。
- 适合在复杂函数、重复逻辑、条件分支和数据组织问题上做精准整改。
- 交叉引用：整体简化用 `code-refiner`；设计原则校验用 `software-design-philosophy`。

## 核心约束
- 重构默认不改行为；若必须改行为，要明确拆成“重构”和“行为变更”两步。
- 优先选最小、安全、可验证的重构序列，而不是一次跳大步。
- 必须先识别异味，再选手法；不要为了秀技巧强行套模式。
- 没有验证路径的高风险重构，默认不能一次完成。

## 代码模式
- 异味分类参考 `skills/refactoring-patterns/references/smell-catalog.md`。
- 动作库按主题拆在 `composing-methods.md`、`moving-features.md`、`organizing-data.md`、`simplifying-conditionals.md`。
- 执行顺序优先参考 `skills/refactoring-patterns/references/refactoring-workflow.md`。


## 检查清单
- 是否先说清楚代码异味和目标状态。
- 是否给出可落地的重构序列而非抽象建议。
- 是否标记需要补测试或人工验证的高风险步骤。
- 是否避免把多个重构意图塞进一次改动。

## 反模式
- 不知道问题是什么就先抽方法。
- 把重构和功能重做混在一起。
- 一次改太多，无法回滚或归因。
- 只追求代码短，不追求结构更清楚。
