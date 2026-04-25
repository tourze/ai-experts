---
name: code-refiner
description: "当用户要在保持行为不变前提下简化代码、降低复杂度、清理嵌套、改进命名或提升可读性时使用。英文触发词 simplify code / reduce complexity / code cleanup。"
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
- 先运行 `scripts/complexity_report.mjs <路径> --format markdown` 找出高复杂度函数。
- 语言细节按需读取 [Python 指南](references/python.md)、[Go 指南](references/go.md)、[TypeScript 指南](references/typescript.md)、[Rust 指南](references/rust.md)。
- 输出推荐按“问题 → 最小重构动作 → 风险 → 验证方式”组织。

```bash
node scripts/complexity_report.mjs src --format markdown
```

## 检查清单
- 是否识别了最长函数、最深嵌套和重复条件。
- 是否明确了哪些逻辑可以抽取、哪些状态应该收敛。
- 是否保留了原有错误语义和调用顺序。
- 是否为高风险重构补了验证步骤或回归测试。

## 反模式

### FAIL: 简化变重写

```
"我把这个文件优化了一下"
git diff: 800 行 → 200 行
→ 删了 50 个 ifs，引入 visitor pattern + factory
→ PR 评审 2 周 / 测试覆盖崩 / 行为意外变化
```

### PASS: 最小重构

```
"提取重复条件 → 命名变量"
diff: -8 +4 行
- if (user.status === 'A' && !user.deleted && user.role !== 'guest') { ... }
+ const isActiveMember = user.status === 'A' && !user.deleted && user.role !== 'guest';
+ if (isActiveMember) { ... }
→ 一眼可读 + 行为完全不变
```

### FAIL: DRY 过头

```ts
// 原：3 处类似但不完全相同的循环
// 重构：抽出 abstractProcessor<T>(items, fn, opts)
→ 每个调用方要传 5 个参数 / 看不出在做什么
→ 调试时要跳 4 层
```

### PASS: 容忍轻微重复

```ts
// 三处相似但语义不同
function processOrders() { for (...) { ... } }
function processInvoices() { for (...) { ... } }
function processRefunds() { for (...) { ... } }
// 各自直观 + 修改互不影响
// "Three is better than premature abstraction"
```
