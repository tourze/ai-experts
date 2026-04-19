# Token Economy 策略

## 四个 Token 池

Agent 上下文中的 token 分为四个池，各需不同管理策略：

| 池 | 内容 | 管理策略 |
|----|------|----------|
| **System Prompt** | 指令、角色、约束 | 静态/动态分离，缓存静态前缀 |
| **Tool Schemas** | 工具名、参数、描述 | 延迟加载，只加载需要的 |
| **对话历史** | user/assistant/tool 消息 | 达阈值时主动压缩/摘要 |
| **工具结果** | 工具调用输出 | 截断大输出，淘汰旧结果 |

## 延迟加载策略

### 两层划分

- **Core tools**（≤10 个）：`always_load = True`，覆盖 90%+ 任务
- **Deferred tools**（其余）：`should_defer = True`，通过 ToolSearch 按需发现

### ToolSearch 实现

```python
def tool_search(query: str) -> list[Tool]:
    """根据查询返回相关的延迟工具"""
    return [t for t in deferred_tools
            if matches(t.search_hint, query)]
```

### 效果

- 40 工具 × 500 tokens = 20K tokens/请求（全量加载）
- 10 核心 + ToolSearch = ~5K tokens/请求（延迟加载）
- 节省 60-80% 工具 schema token

## Prompt 缓存策略

Claude API 支持 prompt caching——如果 system prompt 前 N 个 token 与上次请求一致，可复用缓存。

### 实现原则

```
[静态段：角色、规则、工具指南、风格]   ← 可缓存，所有用户/会话一致
────── CACHE BOUNDARY ──────
[动态段：环境、记忆、会话配置]         ← 不缓存，每次可能不同
```

**关键**：日期、用户名等易变数据必须放在 boundary 之后，否则每次请求都打破缓存。

## 结果预算策略

### 单工具限制

每个工具声明 `max_result_size`，超限时：

| 策略 | 适用场景 | 实现 |
|------|----------|------|
| 头部截断 | 命令输出（开头更重要） | `result[:MAX] + "\n[truncated]"` |
| 落盘引用 | 大文件内容 | 写入磁盘，返回路径 + 用 Read 分页查看 |
| 分页 | 文件读取 | 工具自带 offset/limit 参数 |

### 会话级预算

跟踪整个会话的工具结果 token 总量，超过阈值时淘汰最旧的结果：

```python
class ToolResultBudget:
    MAX_TOTAL_CHARS = 200_000

    def add_result(self, result: str) -> str:
        if self.total + len(result) > self.MAX_TOTAL_CHARS:
            self._evict_oldest_results()
        self.total += len(result)
        return result
```

## 上下文压缩

当总上下文接近模型限制时，**主动**（而非被动）触发压缩：

1. 取最旧的 N 轮对话
2. 用摘要子 Agent 压缩为精简版
3. 替换原始内容
4. 继续对话

**原则**：主动压缩 > 被动压缩。任务执行到一半耗尽上下文，比暂停压缩的代价大得多。
