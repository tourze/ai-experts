# Agent Tool Design

## 适用场景

- 为 AI Agent 设计新工具的接口、权限声明和输入/输出契约。
- 优化 Agent 的 token 开销：工具延迟加载、结果截断、prompt 缓存。
- 审查现有 Agent 工具集的安全元数据和职责划分。
- 需要与 [agent-permission-safety](../agent-permission-safety/SKILL.md) 联动做权限管道设计。

## 核心约束

- **铁律：工具自描述安全属性**——`is_read_only`、`is_destructive`、`is_concurrent_safe` 必须由工具自身声明，禁止在编排层用 switch/if 判断。
- 每个工具必须有双描述：`prompt()`（给模型的长文本）和 `description()`（给用户的短标签），不能共用。
- 模型侧描述必须包含「何时不该用」和「替代工具」，否则模型会误选。
- 40+ 工具的系统必须用延迟加载，核心工具 always-load，其余 deferred + ToolSearch 按需发现。
- 每个工具必须声明 `max_result_size`，超限走截断或落盘+引用，禁止无限输出。

## 实施步骤

### 步骤 1：定义工具规格对象

为每个工具填充完整规格，详见 [references/tool-specification.md](references/tool-specification.md)。

### 步骤 2：划分加载层级

按使用频率将工具分为 always-load（≤10 个）和 deferred（其余），详见 [references/token-economy.md](references/token-economy.md)。

### 步骤 3：设计结果预算

为每个工具设 `max_result_size`，选择截断策略（头部保留 / 落盘引用 / 分页），详见 [references/token-economy.md](references/token-economy.md)。

## 代码模式

### FAIL: 安全逻辑写在编排层

```python
# ❌ 编排层维护安全清单，新增工具必须改编排代码
if tool_name in ["delete_file", "run_migration"]:
    confirm_with_user()
```

→ 不 scale；新工具忘加就是安全漏洞。

### PASS: 工具自声明安全属性

```python
# ✅ 工具自带元数据，编排层只读属性
if tool.is_destructive():
    confirm_with_user()
```

→ 新增工具只要实现接口，编排层零改动。

### FAIL: 40 个工具全量加载

```python
tools = get_all_tools()  # 40 × 500 tokens = 20K tokens/请求
```

→ 每次请求多花 20K tokens，绝大部分从未使用。

### PASS: 核心 + 延迟加载

```python
tools = get_core_tools()        # ~10 个高频工具
# 模型需要时调用 ToolSearch 按需发现
```

→ 90%+ 请求只用核心工具，token 节省 60-80%。

## 验证清单

- [ ] 每个工具是否声明了 `is_read_only`、`is_destructive`、`is_concurrent_safe`？
- [ ] 模型侧描述是否说明了「何时不该用此工具」？
- [ ] 工具集是否划分为 always-load 和 deferred 两层？
- [ ] 每个工具是否有 `max_result_size` 和超限策略？
- [ ] 工具名称是否互不重叠、语义明确？
- [ ] 输入 schema 是否用严格类型（无 `any`）？

## 反模式

- **单一描述复用**：模型和 UI 共用一句话描述 → 模型得不到足够上下文，误选率高。
- **全量加载**：所有工具每次请求都发送 → token 浪费，延迟上升。
- **无输出上限**：工具返回完整文件/日志 → 上下文溢出，后续推理崩坏。
- **职责重叠**：两个工具都能搜索文件 → 模型在它们之间反复摇摆。
