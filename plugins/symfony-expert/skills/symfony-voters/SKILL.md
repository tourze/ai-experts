---
name: symfony-voters
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: 通过显式的、有测试支撑的执行机制来强化 Symfony 授权和验证边界。当处理 Symfony Voters 相关任务时触发。
---

# Symfony Voters (Symfony)

## 使用场景
- 强化访问控制或验证边界。
- 将 Voters/安全表达式与领域规则对齐。

## 默认工作流
1. 映射操作者/资源/动作决策矩阵。
2. 在正确的边界实现 Voter/约束逻辑。
3. 在控制器和 API 操作中接入检查。
4. 全面测试允许/拒绝/无效路径。

## 防护机制
- 避免策略逻辑在多层之间重复。
- 不要通过错误详情泄露特权状态。
- 对敏感操作保持显式拒绝行为。

## 渐进式信息披露
- 使用本文件了解执行姿态和风险控制。
- 需要深入实现细节时打开参考文档。

## 输出契约
- 安全边界更新。
- 执行决策的集成点。
- 异常路径测试结果。

## 参考文档
- `reference.md`
- `docs/complexity-tiers.md`
