---
name: user-story-patterns
description: 当用户要编写高质量用户故事、按 INVEST 原则检查故事质量、或用 8 种模式拆分过大故事时使用；英文触发词 user story、story splitting、INVEST、acceptance criteria、Gherkin。
---

# 用户故事编写与拆分

## 适用场景
- 把需求转写成符合 INVEST 的用户故事。
- 故事太大无法在一个 Sprint 完成，需要系统化拆分。详见 [references/splitting-patterns.md](references/splitting-patterns.md)。
- 与 [agile-product-owner](../agile-product-owner/SKILL.md) 配合做 Sprint 规划，与 [epic-decomposition](../epic-decomposition/SKILL.md) 配合从 Epic 层级开始分解。
- INVEST 检查详见 [references/invest-checklist.md](references/invest-checklist.md)。

## 核心约束
- 每条故事必须满足 INVEST（Independent, Negotiable, Valuable, Estimable, Small, Testable）。
- 验收标准用 Given/When/Then，覆盖成功路径、失败路径和至少一个边界条件。
- 拆分后每条子故事必须**独立交付用户价值**，不允许按技术分层拆（"前端""后端""数据库"）。
- 拆不出 2 条有独立价值的子故事 → 已经够小，不需要拆。

## 代码模式

```markdown
**用户故事**：作为 <角色>，我想要 <动作>，以便 <收益>

**验收标准**：
- Given <前置条件> When <动作> Then <预期结果>
- Given <前置条件> When <异常动作> Then <错误处理>
- Given <边界条件> When <动作> Then <边界结果>
```

8 种拆分模式速查：工作流步骤 | 业务规则 | 数据变体 | 界面复杂度 | CRUD | 角色权限 | 性能级别 | 先能用再好用。详见 [references/splitting-patterns.md](references/splitting-patterns.md)。

## 检查清单
- [ ] 每条故事有角色、动作、收益三要素。
- [ ] 验收标准覆盖成功、失败和边界路径。
- [ ] 拆分后的子故事各自有独立用户价值。
- [ ] 通过 INVEST 6 项检查。

## 反模式

### FAIL: 按技术层拆分

```
原始：用户能查看订单历史
拆分：创建 orders 表和 API | 前端订单列表页 | 分页组件
→ 单条无法独立 demo，违反 Independent 和 Valuable
```

### PASS: 按用户价值拆分

```
拆分：
- 看到最近 10 条订单摘要（日期、金额、状态）
- 点击订单查看详情（商品、物流、发票）
- 按日期范围筛选历史订单
→ 每条都能独立 demo
```

### FAIL: 验收标准是 wishlist

```
AC：页面好看 | 加载快 | 体验好 → 无法测试
```

### PASS: Given/When/Then

```
Given 用户已登录且有 3 条订单
When 打开"我的订单" Then 按时间倒序显示 3 条

Given 用户无历史订单
When 打开"我的订单" Then 显示"暂无订单"和"去逛逛"按钮
```
