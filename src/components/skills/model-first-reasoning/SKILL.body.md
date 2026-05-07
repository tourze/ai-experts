## 代码模式

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

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
