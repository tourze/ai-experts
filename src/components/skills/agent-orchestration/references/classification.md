# Permission Classification

## 分类层级

| 层级 | 输入 | 输出 | 说明 |
| --- | --- | --- | --- |
| Static rule | Tool name, schema, path, command tokens. | `allow` / `ask` / `deny` / `needs-ai` | 快速、确定、可测试。 |
| Tool self-check | Tool-specific semantics. | `allow` / `ask` / `deny` / `passthrough` | 由工具维护领域知识。 |
| AI classifier | Ambiguous intent and context. | `allow` / `ask` / `deny` with reason. | 只处理规则无法判断的少数情况。 |

## Rule-First Strategy

- 明确危险：直接 `deny` 或 `ask`。
- 明确安全：只读、无外部副作用、限定路径内，直接 `allow`。
- 歧义：交给 AI 分类器，但分类器结果仍受 bypass-immune 规则约束。

## Classifier Prompt Inputs

- Tool id and declared safety metadata.
- Normalized input, redacted secrets, and target paths.
- Current permission mode.
- User's explicit instruction and recent confirmation state.
- Static rule hits and why they were insufficient.

## Audit Record

每次决策记录：

```json
{
  "tool": "bash",
  "decision": "ask",
  "source": "ai-classifier",
  "reason": "Command writes outside the workspace",
  "permission_mode": "auto-safe"
}
```
