# Tool Specification Object

每个 Agent 工具应实现以下规格接口：

```
Tool<Input, Output>:
  name: string                    # 唯一标识符，模型用来选择
  prompt(): string                # 模型侧长描述（何时用/何时不用/参数说明/失败模式）
  description(): string           # UI 侧短标签（人类一眼可读）

  # 安全元数据
  is_read_only(): bool            # 是否只读，不修改任何状态
  is_destructive(): bool          # 是否可能造成不可逆损害
  is_concurrent_safe(): bool      # 是否可与其他工具并行执行

  # 权限
  check_permissions(input, ctx): PermissionResult  # allow / deny / ask / passthrough

  # 加载策略
  always_load: bool               # True = 每次请求都包含 schema
  should_defer: bool              # True = 延迟加载，通过 ToolSearch 发现
  search_hint: string             # 延迟工具的搜索关键词

  # 输出管理
  max_result_size: int            # 最大输出字符数
  call(input): Output             # 执行逻辑
  render_tool_use(input): string  # UI 展示工具调用
  render_tool_result(out): string # UI 展示工具结果
```

## 安全元数据设计原则

| 属性 | 语义 | 典型值 |
|------|------|--------|
| `is_read_only` | 工具是否永远不改变任何外部状态 | Grep=True, Edit=False |
| `is_destructive` | 操作是否可能造成不可逆损害 | DeleteFile=True, Write=False |
| `is_concurrent_safe` | 是否可安全并行 | Read=True, Edit=False |

**原则**：安全属性由工具自己声明，不由调用方推断。
权限引擎、UI 和并行调度器都通过这三个属性决策，无需了解工具内部实现。

## 双描述设计

### prompt()（模型侧）应包含：

1. 一句话说明工具做什么
2. 何时使用（正面场景）
3. 何时**不该**使用（关键！防止误选）
4. 每个参数的说明和示例
5. 失败模式和处理方式
6. 替代工具提示

### description()（UI 侧）应包含：

- 简短动作标签（5-10 字）
- 用户能一眼理解「刚才发生了什么」

**反模式**：两者共用同一句话。模型得不到足够决策信息，用户看到冗长技术文本。

## check_permissions() 返回值

| 返回值 | 含义 |
|--------|------|
| `allow` | 直接放行 |
| `deny` | 直接拒绝，附带理由 |
| `ask` | 弹出用户确认 |
| `passthrough` | 工具无意见，交由外层权限引擎决策 |

**原则**：工具只处理自己领域内的权限判断，不越界做外层决策。
`passthrough` 是默认返回值——大多数工具对权限没有特殊要求。
