---
name: refactoring-checklist
description: "当用户要重构、重组或清理代码，需要确保安全性和增量推进时使用。"
metadata:
  version: "0.1.0"
  category: "refactoring"
  tags: ["refactoring", "safety", "checklist", "incremental"]
  when_to_use: "当用户要重构、重组或清理代码时使用"
  trigger:
    - "refactor this"
    - "clean up"
    - "restructure"
    - "重构"
---

# 重构前安全检查清单

## 适用场景
- 用户要对现有代码做结构调整、抽取、合并、移动职责。
- 用户觉得代码"很乱"想整理但没想清楚具体做什么。
- 交叉引用：降低复杂度配合 `complexity-reducer`；审查结果配合 `code-review`；具体重构手法参考 `refactoring-patterns`。

## 核心约束
- 重构 = 改结构不改行为。行为变更（bug 修复、新功能）必须另开提交。
- 没有测试覆盖的代码，先补表征测试再重构。
- 每步保持系统可运行、测试可通过。
- 范围必须提前确定，防止"顺手改"扩散。

## 准入四项
详细检查项见 [references/pre-checks.md](./references/pre-checks.md)。

1. **测试基线** — 有测试吗？可信吗？覆盖率多少？没有就先补。
2. **范围界定** — 明确要动什么、不动什么、影响哪些调用方。超过 5 个文件考虑分批。
3. **目标明确** — 一句话说清重构完变成什么样，收益是什么。
4. **回滚方案** — 干净分支、每步独立提交、知道怎么回到起点。

## 增量步骤循环
做一个小变更 → 跑测试 → 提交 → 重复。常见动作和风险等级见 [references/incremental-actions.md](./references/incremental-actions.md)。

## 检查清单
- [ ] 有测试覆盖（或已补表征测试）
- [ ] 范围已界定，排除项已明确
- [ ] 在干净分支上操作，每步提交
- [ ] 重构提交不混入行为变更
- [ ] 重构后覆盖率不低于基线

## 反模式
- 没测试就重构，改完不知道有没有破坏行为。
- 重构变重写：本来说"整理一下"，最后推翻重来。
- 大爆炸提交：一个提交改 50 个文件，出问题无法定位。
- 重构搭车：顺手修 bug 加功能。
- 不限范围：从一个重命名开始，一路改到数据库 schema。
