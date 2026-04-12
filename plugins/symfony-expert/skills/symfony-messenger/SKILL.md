---
name: symfony-messenger
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: 实现具备幂等性、重试机制和运营可观测性的弹性 Symfony 异步工作流。当处理 Symfony Messenger 相关任务时触发。
---

# Symfony Messenger (Symfony)

## 使用场景
- 使用 Messenger/Scheduler/Cache 实现异步工作流。
- 稳定重试和失败传输配置。

## 默认工作流
1. 定义异步契约和投递语义。
2. 实现幂等处理器和路由策略。
3. 配置重试、失败传输和可观测性。
4. 验证成功/失败重放场景。

## 防护机制
- 假设至少一次投递（at-least-once），而非精确一次（exactly-once）。
- 保持处理器的确定性并关注副作用。
- 明确毒消息（poison message）的处理策略。

## 渐进式信息披露
- 使用本文件了解执行姿态和风险控制。
- 需要深入实现细节时打开参考文档。

## 输出契约
- 异步配置/处理器已更新。
- 重试/失败策略决策。
- 运营验证证据。

## 参考文档
- `reference.md`
- `docs/complexity-tiers.md`
