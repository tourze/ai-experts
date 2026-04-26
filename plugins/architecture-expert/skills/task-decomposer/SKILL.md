---
name: task-decomposer
description: "当用户要把复杂需求拆成任务板、依赖关系、关键路径、并行工作项、执行合同草案、风险和测试策略时使用。英文触发词 task decomposition / work breakdown / dependency map / execution contract generation。"
---

# task-decomposer

## 适用场景
- 适合复杂功能、跨团队协作、需要排关键路径和并行度的实现计划。
- 适合从模糊需求落到可执行任务，而不是只列几句待办。
- 交叉引用：先审计划质量用 `plan-review`；需要完整功能工作流用 `feature-dev`；需要把拆解结果持久化到文件用 `persistent-planning`。
- 当用户要为后续子代理/多 agent 执行准备计划或交接文本时，输出 Execution Contract，供 `subagent-driven-development` 消费。

## 核心约束
- 任务粒度要能在单个 PR 内完成、可验证、可交付。
- 必须显式区分硬依赖、软依赖和可并行任务。
- 标记可并行任务时必须给出 `read_scope` / `write_scope`；同一并行组内 `write_scope` 重叠则不能并行。
- 要同时覆盖边界场景、风险和测试策略，不要只拆开发任务。
- 如果需求太模糊，要先写清假设而不是硬拆。

## 代码模式
- 拆解策略、依赖建模、边界清单和 sizing 参考 `references/*.md`。
- 默认分成 Foundation / Core Logic / Integration / Polish 四阶段。
- 输出中建议带任务表、依赖箭头、风险标记和测试等级。

### Execution Contract 模式

当用户要求生成/设计/拆解可交给子代理或多 agent 执行的计划，或提到“分波计划”“handoff”“execution contract generation”时，除常规任务表外，追加一个可复制的合同块。合同只描述计划，不执行任务。

如果用户要求执行、派遣、启动 worker、run/execute 现有合同或“现在按合同开工”，不要使用本模式；转交 `subagent-driven-development`。

```json
{
  "goal": "one sentence outcome",
  "waves": [
    {
      "id": "W1",
      "purpose": "explore | implement | verify | fix",
      "tasks": [
        {
          "id": "T001",
          "intent": "task outcome, not micro-steps",
          "read_scope": ["path/or/glob"],
          "write_scope": ["path/or/glob"],
          "depends_on": [],
          "acceptance_refs": ["A1"]
        }
      ]
    }
  ],
  "acceptance": [
    {
      "id": "A1",
      "must": "observable requirement",
      "evidence_type": "command | diff | artifact | manual",
      "command": "optional verification command"
    }
  ]
}
```

合同规则：
- `write_scope: []` 表示只读探索，可与其他只读任务并行。
- 同一 wave 内任意两个任务的 `write_scope` 不能重叠；重叠时拆到不同 wave 或合并成一个任务。
- 每个实现任务至少绑定一个 `acceptance_refs`；没有验收引用的实现任务不可交给子代理。
- `acceptance.command` 只放真实可运行的验证命令；不能用源码 grep 伪装运行时测试。

## 检查清单
- 是否写清了用户目标、验收标准和范围边界。
- 是否把任务切到单 PR 可完成的粒度。
- 是否为每阶段补齐边界场景和测试方式。
- 是否标记关键路径、并行项和高风险项。
- 若输出 Execution Contract，是否检查了同 wave `write_scope` 不重叠且实现任务都有验收引用。

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

### FAIL: 并行任务写同一范围

```json
{
  "waves": [
    {
      "id": "W2",
      "tasks": [
        { "id": "T1", "write_scope": ["src/auth/**"] },
        { "id": "T2", "write_scope": ["src/auth/token.ts"] }
      ]
    }
  ]
}
```

→ 两个任务会争抢同一实现区域，不能并行。

### PASS: 并行前先隔离写范围

```json
{
  "waves": [
    {
      "id": "W2",
      "tasks": [
        { "id": "T1", "write_scope": ["src/auth/token.ts"], "acceptance_refs": ["A1"] },
        { "id": "T2", "write_scope": ["tests/auth-token.test.ts"], "acceptance_refs": ["A2"] }
      ]
    }
  ]
}
```

→ 写范围互不重叠，且都有验收引用，可以交给执行阶段判断是否并行。
