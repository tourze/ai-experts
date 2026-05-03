---
name: complexity-reducer
description: "当代码过于复杂、嵌套太深、函数太长、耦合严重，或用户要求简化代码、清理命名、降低复杂度时使用。"
---

# 复杂度识别与简化

## 适用场景
- 代码能跑但难以理解、修改和测试。
- 函数超长、嵌套超深、参数超多、条件超复杂。
- 上线前做可维护性整理，而不是功能性重写。
- 交叉引用：重构流程纪律配合 `refactoring-checklist`；具体重构手法配合 `architecture-expert/refactoring-patterns`；审查结果配合 `code-review`；设计哲学参考 `software-design-philosophy`；完成前验证检查清单见 [references/verification-checklist.md](./references/verification-checklist.md)。

## 核心约束
- 目标是降低认知复杂度，不是减少行数。
- 先定位复杂度来源，再决定策略。
- 每次简化保持行为不变——这是重构不是重写。
- 本质复杂度（业务规则就是复杂的）不强行简化逻辑，而是改善组织。
- 简化后必须更容易理解，不是更"巧妙"。

## 复杂度来源与对策
每种来源的详细症状、对策和代码示例见 [references/patterns.md](./references/patterns.md)。
按语言看具体重构示例：[Python 指南](references/python.md)、[Go 指南](references/go.md)、[TypeScript 指南](references/typescript.md)、[Rust 指南](references/rust.md)。

需要定量度量时优先跑 `scripts/complexity_report.mjs <路径> --format markdown`，按"问题 → 最小重构动作 → 风险 → 验证方式"组织产出，而不是凭主观感受决定。

```bash
node scripts/complexity_report.mjs src --format markdown
```

| 来源 | 判定标准 | 首选对策 |
|------|---------|---------|
| 深嵌套 | > 3 层 | Guard clause / Early return |
| 长函数 | > 30-40 行 | 按段落抽取函数 |
| 过多参数 | > 3-4 个 | 参数对象 / 拆分函数 |
| 布尔参数爆炸 | 多个 bool | 枚举替代 / 拆分函数 |
| 特性嫉妒 | 大量访问他人数据 | 逻辑移到数据所在方 |
| 原始类型偏执 | 字符串/int 承载语义 | 引入值对象 |
| 条件过长 | 多个 &&/\|\| 组合 | 抽取命名布尔 / 查找表 |

## 简化流程
1. 度量：识别嵌套深度、函数长度、参数数量。
2. 排序：按复杂度从高到低。
3. 逐个简化：每次一个来源，简化后跑测试。
4. 验证：不熟悉代码的人能一眼看出它在做什么吗？

## 检查清单
- [ ] 已识别最主要的复杂度来源
- [ ] 简化策略与来源匹配
- [ ] 每次简化保持行为不变
- [ ] 简化后更容易理解（不只是更短）
- [ ] 没有引入新复杂度（如过度抽象）

## 反模式

### FAIL: 为减少行数牺牲可读性

```javascript
const r = d?.items?.filter(i => i.active && i.type !== 'draft')
  .map(i => ({...i, total: i.qty * (i.price - (i.discount || 0))}))
  .reduce((a, b) => ({...a, [b.id]: b}), {});
```

→ 一行做了过滤、计算、归并三件事，无法断点调试，出错无法定位。

### PASS: 分步命名，每步可验证

```javascript
const activeItems = data.items.filter(item => item.active && item.type !== 'draft');
const itemsWithTotal = activeItems.map(item => ({
  ...item,
  total: item.qty * (item.price - (item.discount ?? 0)),
}));
const itemsById = Object.fromEntries(itemsWithTotal.map(item => [item.id, item]));
```

### FAIL: 只移动复杂度不消除

```python
# 把 50 行 if-else 从 process() 搬到 _helper()
def process(data):
    return _helper(data)  # 复杂度原封不动

def _helper(data):
    # 还是 50 行 if-else...
```

### PASS: 用查找表消除分支

```python
HANDLERS = {
    "credit": handle_credit,
    "debit": handle_debit,
    "refund": handle_refund,
}

def process(data):
    handler = HANDLERS.get(data.type)
    if not handler:
        raise ValueError(f"unknown type: {data.type}")
    return handler(data)
```
