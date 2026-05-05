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
