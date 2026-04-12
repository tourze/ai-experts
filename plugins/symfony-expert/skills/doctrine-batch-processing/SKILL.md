---
name: doctrine-batch-processing
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: 安全地演进 Symfony Doctrine 模型和数据库结构，兼顾完整性、性能和发布纪律。当处理 Doctrine 批处理相关任务时触发。
---

# Doctrine 批处理 (Symfony)

## 使用场景
- 设计实体关系或数据库结构演进。
- 提升 Doctrine 的正确性/性能。

## 默认工作流
1. 建模所有权/基数关系和事务边界。
2. 以迁移安全的方式应用映射/结构变更。
3. 针对热路径调优抓取/查询行为。
4. 通过针对性测试验证生命周期行为。

## 防护机制
- 保持拥有方/被拥有方的一致性。
- 避免在单次发布中进行破坏性迁移跳跃。
- 消除意外的 N+1 查询和过度抓取。

## 渐进式信息披露
- 使用本文件了解执行姿态和风险控制。
- 需要深入实现细节时打开参考文档。

## 输出契约
- 实体/迁移变更。
- 完整性和性能决策。
- 验证结果和回滚说明。

## 参考文档
- `reference.md`
- `docs/complexity-tiers.md`
