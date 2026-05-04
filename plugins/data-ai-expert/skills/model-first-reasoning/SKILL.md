---
name: model-first-reasoning
description: 当用户明确要求 model-first 或任务涉及状态机、约束系统等需要先建模的场景时使用。
---

# model-first-reasoning

## 适用场景

- 功能复杂，直接编码容易引入隐含状态、漏掉约束或发明接口。
- 任务包含显式状态转换、权限矩阵、调度规则、工作流编排、约束求解。
- 用户要求先建模型、先写约束、先确认 requirement trace，再进入实现阶段。
- 相关资源：[MODEL_TEMPLATE.json](MODEL_TEMPLATE.json)、[scripts/validate-model.mjs](scripts/validate-model.mjs)。
- 相关 skill：[llm-evaluation](../llm-evaluation/SKILL.md)、[prompt-engineering-patterns](../prompt-engineering-patterns/SKILL.md)。

## 核心约束

- Phase 1 只产出模型，不写实现代码。
- Phase 2 只能在 Phase 1 已冻结的实体、状态、动作、约束内实现；如果模型不够，必须先返回 `MODEL INCOMPLETE`。
- 每个用户需求都要能映射到 `goal`、`constraint`、`action` 三者之一。
- 进入编码前必须运行结构校验；`unknowns` 不为空时，停在 Phase 1。

## 代码模式

```bash
node scripts/validate-model.mjs \
  MODEL_TEMPLATE.json
```

```json
{
  "deliverable": { "description": "Refund workflow" },
  "actions": [
    {
      "name": "approve_refund",
      "preconditions": ["request.status == pending"],
      "effects": ["request.status = approved"]
    }
  ],
  "constraints": [
    { "id": "C1", "statement": "Approved refund cannot be approved twice" }
  ]
}
```

## 检查清单

- 用户需求是否都被映射进 `goal` / `constraint` / `action`。
- 是否存在实现阶段才会冒出来的新实体或新状态。
- `unknowns` 是否已经清零。
- 是否已经运行 [scripts/validate-model.mjs](scripts/validate-model.mjs)。
- 进入实现后，验证方案是否交给 [llm-evaluation](../llm-evaluation/SKILL.md) 或现有测试体系覆盖。

## 反模式

### FAIL: 边写代码边补模型

```python
# 直接开始写
def approve_refund(req): ...
def reject_refund(req): ...
# 写到一半发现："咦，approved 之后还能 cancel 吗？"
# → 临时加状态 → 状态机污染 → 测试漏覆盖
```

### PASS: Phase 1 冻结模型再编码

```json
{
  "states": ["pending", "approved", "rejected", "refunded", "cancelled"],
  "transitions": [
    { "from": "pending", "to": "approved", "via": "approve_refund" },
    { "from": "approved", "to": "refunded", "via": "process_payment" },
    { "from": "approved", "to": "cancelled", "via": "cancel_approved",
      "guard": "before_payment_processed" }
  ],
  "constraints": [
    "C1: refunded 是终态",
    "C2: cancelled 只能从 pending 或 approved（未支付前）转入"
  ]
}
```

### FAIL: 模型不写约束

```json
{ "actions": ["approve", "reject", "refund"] }
// 没说"不能重复 approve"，开发阶段漏掉 → 双倍退款
```

### PASS: 显式约束

```json
{ "actions": [...],
  "constraints": [
    "C1: 同一 request 不能 approve 两次",
    "C2: refund 金额 ≤ 原订单金额",
    "C3: 跨日 approve 需二级审批"
  ]
}
// → 自动生成测试用例，每条约束 1 条 negative test
```
