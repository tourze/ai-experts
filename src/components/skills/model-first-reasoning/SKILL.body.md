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
