# Permission Pipeline

## 权限模式谱系

| 模式 | 默认行为 | 适用场景 |
| --- | --- | --- |
| `plan` | 只读、只建议，不执行写入。 | 设计、评审、风险分析。 |
| `ask` | 风险操作先询问用户。 | 默认交互模式。 |
| `auto-safe` | 明确安全的只读或低风险操作自动执行。 | 高频开发循环。 |
| `auto-expanded` | 允许更宽的自动执行，但 bypass-immune 操作仍需确认。 | 用户明确授权的批处理。 |

## 三阶段管道

1. `validateInput(tool, input)`：结构、schema、路径、参数边界。
2. `tool.checkPermissions(input, context)`：工具领域内的读写、破坏性、并发安全判断。
3. `permissionEngine.evaluate(tool, input, context)`：全局策略、用户模式、规则层、AI 分类器和审计。

## 决策规则

- 任一阶段返回 `deny` 立即停止。
- 任一阶段返回 `ask` 立即要求人工确认。
- 只有全部阶段明确 `allow` 才执行。
- 异常、超时、分类器不可用统一按 `deny` 或 `ask` 处理，不能放行。

## Bypass-Immune 操作

这些操作即使在自动模式下也必须确认：

- 删除用户数据、密钥、凭证、生产配置。
- 运行迁移、发布、回滚、付费或不可逆外部调用。
- 修改权限、角色、访问控制、审计策略。
- 访问或导出敏感数据。
