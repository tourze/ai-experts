---
name: task-decomposer
description: "当用户要把复杂需求拆成任务板、依赖关系、关键路径、并行工作项、风险和测试策略时使用。英文触发词 task decomposition / work breakdown / dependency map。"
---

# task-decomposer

## 适用场景
- 适合复杂功能、跨团队协作、需要排关键路径和并行度的实现计划。
- 适合从模糊需求落到可执行任务，而不是只列几句待办。
- 交叉引用：先审计划质量用 `plan-review`；需要完整功能工作流用 `feature-dev`；需要把拆解结果持久化到文件用 `persistent-planning`。

## 核心约束
- 任务粒度要能在单个 PR 内完成、可验证、可交付。
- 必须显式区分硬依赖、软依赖和可并行任务。
- 要同时覆盖边界场景、风险和测试策略，不要只拆开发任务。
- 如果需求太模糊，要先写清假设而不是硬拆。

## 代码模式
- 拆解策略、依赖建模、边界清单和 sizing 参考 `references/*.md`。
- 默认分成 Foundation / Core Logic / Integration / Polish 四阶段。
- 输出中建议带任务表、依赖箭头、风险标记和测试等级。


## 检查清单
- 是否写清了用户目标、验收标准和范围边界。
- 是否把任务切到单 PR 可完成的粒度。
- 是否为每阶段补齐边界场景和测试方式。
- 是否标记关键路径、并行项和高风险项。

## 反模式

### FAIL: 太粗

```
- 实现支付功能（2 周）
→ 团队不知道从哪开始 / 无法估时 / 无法 PR review
```

### PASS: 单 PR 粒度

```
Foundation
- T1: 定义 PaymentRequest/Result DTO（0.5 天）
- T2: 接入 Stripe SDK + dummy charge（1 天）
Core
- T3: 实现 charge() + 错误码映射（1 天）
- T4: 实现 refund() + 退款规则（1 天）
- T5: webhook 处理 + 幂等（1.5 天）
Integration
- T6: 接入 OrderService（1 天）
- T7: E2E 测试（1 天）
Polish
- T8: 监控 + 告警（0.5 天）
```

### FAIL: 太细

```
- 创建文件 PaymentService.ts（5 分钟）
- 加 import 语句（2 分钟）
- 写 charge 函数签名（5 分钟）
→ 50 个微任务 → 无人 review / 跟踪成本 > 实施成本
```

### PASS: 单元 = "可独立 demo"

```
"完成后能在哪个场景下 demo？"
能 → 任务粒度合适
不能（"我加了 import"）→ 与下一步合并
```

### FAIL: 只拆编码

```
T1: 实现 charge
T2: 实现 refund
T3: 实现 webhook
→ 上线前一天："tests? monitoring? rollback?"
```

### PASS: 编码 + 验证 + 发布

```
T1-T5: 编码
T6: 单元 + 集成测试
T7: 灰度 1% → 10% → 100%
T8: 监控告警 + runbook
T9: 回滚演练
```
