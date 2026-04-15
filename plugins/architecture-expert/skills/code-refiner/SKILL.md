---
name: code-refiner
description: "在需要保持行为不变的前提下简化代码、降低复杂度或提升可读性时使用。"
---

# code-refiner

## 适用场景
- 适合函数过长、嵌套过深、职责混乱、命名欠清晰或补丁味道过重的代码。
- 适合在上线前做可维护性整理，而不是做功能性重写。
- 交叉引用：需要明确重构动作时配合 `refactoring-patterns`；需要复杂度设计原则时配合 `software-design-philosophy`。

## 核心约束
- 默认目标是“行为不变的简化”，不是趁机加特性。
- 先定位复杂度来源，再决定抽取、合并、拆分还是改名，不要凭直觉乱重构。
- 涉及错误边界时优先保持现有语义，并用 `error-handling-patterns` 校验。
- 如果需要定量度量，使用内置复杂度脚本而不是主观感受。

## 代码模式
- 先运行 `skills/code-refiner/scripts/complexity_report.py <路径> --format markdown` 找出高复杂度函数。
- 语言细节按需读取 `skills/code-refiner/references/python.md`、`go.md`、`typescript.md`、`rust.md`。
- 输出推荐按“问题 → 最小重构动作 → 风险 → 验证方式”组织。

```bash
python3 skills/code-refiner/scripts/complexity_report.py src --format markdown
```

## 检查清单
- 是否识别了最长函数、最深嵌套和重复条件。
- 是否明确了哪些逻辑可以抽取、哪些状态应该收敛。
- 是否保留了原有错误语义和调用顺序。
- 是否为高风险重构补了验证步骤或回归测试。

## 反模式
- 把“简化”做成大规模重写。
- 为了追求 DRY 牺牲可读性或调试性。
- 复杂度高的根因没变，只是移动代码位置。
- 忽略副作用、异常路径和状态边界。
