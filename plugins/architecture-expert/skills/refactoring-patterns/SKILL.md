---
name: refactoring-patterns
description: "当用户要选择命名化重构手法、分离重构与功能变更、处理代码异味或保持行为不变改结构时使用。英文触发词 refactoring patterns / extract method / code smell。"
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
- 异味分类参考 [异味目录](references/smell-catalog.md)。
- 动作库按主题拆在 [方法组合](references/composing-methods.md)、[特性搬移](references/moving-features.md)、[数据整理](references/organizing-data.md)、[条件简化](references/simplifying-conditionals.md)。
- 执行顺序优先参考 [重构流程](references/refactoring-workflow.md)。


## 检查清单
- 是否先说清楚代码异味和目标状态。
- 是否给出可落地的重构序列而非抽象建议。
- 是否标记需要补测试或人工验证的高风险步骤。
- 是否避免把多个重构意图塞进一次改动。

## 反模式

### FAIL: 重构和功能变更混在一个 commit

```
commit abc1234: "重构 OrderService 并添加折扣逻辑"
  - 抽取了 3 个方法
  - 改了计算公式
  - 加了新参数
```

→ 无法区分哪个改动导致回归，也无法安全回滚。

### PASS: 先重构再变更，分 commit

```
commit abc1234: "refactor: extract calculateSubtotal from OrderService"
  - 只抽方法，行为不变，测试全绿
commit def5678: "feat: add discount calculation to OrderService"
  - 在重构后的清晰结构上加新逻辑
```

### FAIL: 不知道问题就先抽方法

```python
# "这个函数太长了，先拆一下"
def step_1(data): ...
def step_2(data): ...
def step_3(data): ...
def process(data):
    return step_3(step_2(step_1(data)))
```

→ 拆出的函数没有业务含义，只是机械分割，读者要跳转更多次。

### PASS: 先识别异味再选手法

```python
# 异味：process() 中间有"解析→校验→转换"三个阶段混在一起
# 手法：Extract Method，按阶段命名
def parse_input(raw: str) -> ParsedOrder: ...
def validate_order(order: ParsedOrder) -> ValidOrder: ...
def transform_to_dto(order: ValidOrder) -> OrderDTO: ...
```
