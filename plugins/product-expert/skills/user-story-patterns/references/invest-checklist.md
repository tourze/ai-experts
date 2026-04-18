# INVEST 检查表

| 原则 | 问题 | 不通过信号 |
|---|---|---|
| Independent | 能否不依赖其他故事独立交付？ | "等 XX 做完才能开始" |
| Negotiable | 实现方式是否可协商？ | 故事里写死了技术方案 |
| Valuable | 用户或业务能从中获得什么？ | "搭建数据库表" |
| Estimable | 团队能否估算工作量？ | "优化系统性能" |
| Small | 能否在一个 Sprint 内完成？ | 超过团队容量 1/3 |
| Testable | 能否写出明确的测试用例？ | "提升用户体验" |

## 常见不通过原因及修复

**Independent 不通过**：把有依赖的部分用 mock/stub 替代，或合并强依赖的故事。

**Valuable 不通过**：问"用户拿到这个能做什么？"如果答不出来，它是任务不是故事。

**Small 不通过**：用 8 种拆分模式（见 splitting-patterns.md）拆分。

**Testable 不通过**：补 Given/When/Then 验收标准。写不出 AC 说明需求还不清楚。
