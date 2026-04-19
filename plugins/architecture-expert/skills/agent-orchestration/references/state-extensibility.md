# 状态管理与扩展性

## 四种状态类型

| 类型 | 生命周期 | 存储 | 访问速度 |
|------|----------|------|----------|
| **Turn state** | 单次 API 调用 | 上下文内 | 即时 |
| **Session state** | 对话持续期间 | 内存（AppState） | 快 |
| **Persistent memory** | 跨会话 | 磁盘文件 | 会话启动时加载 |
| **Project config** | 项目生命周期 | 配置文件 | 初始化 + 按需读取 |

**原则**：混淆不同类型会导致数据丢失（过度易变）或数据过期（过度持久）。

## 层级配置

```
~/.agent/config          ← 全局用户偏好
  /project/agent.md      ← 项目级配置
    /src/agent.md        ← 子目录覆盖
      /src/api/agent.md  ← 更具体的覆盖
```

每层可添加指令，低层覆盖高层：
- 全局：始终用 TypeScript strict mode
- 项目：此项目用 PEP8
- 子目录：此 API 模块需要额外安全审查

## 记忆提取与注入

### 提取（对话后）

由专用提取 Agent 自动识别值得记忆的事实：
- 用户偏好
- 项目约束
- 反馈（什么不该做）
- 参考指针（外部系统位置）

### 注入（会话启动时）

相关记忆加载到 system prompt 的 `memory` 动态段。

**原则**：记忆由专用 Agent 提取，不由用户手动维护。

## Session State（AppState）

会话级存储持有运行时变化的一切：

- 当前对话消息
- 进行中的工具调用
- 文件状态缓存（已读/已写的文件）
- 本会话的权限决策
- 后台任务注册表
- 成本/token 跟踪

```python
# 不可变更新模式
app_state = app_state.update(
    messages=[*app_state.messages, new_message]
)
```

**为什么不可变？** 调试更容易（可重放状态变更）；防止异步操作间的意外突变。

## 文件状态缓存

跟踪会话中已读或已修改的文件：

```python
file_cache = {
    "/path/to/file.ts": {
        "last_read": timestamp,
        "content_hash": hash,
        "modified_by_us": True
    }
}
```

用途：检测外部修改（另一个进程改了我们要编辑的文件）；避免重复读取未变更文件；构建文件访问审计日志。

---

## 扩展性模式

### 协议扩展（MCP）

标准工具协议是主要的工具扩展机制：
1. 实现协议兼容的服务器
2. 通过标准传输连接（stdio, HTTP, WebSocket）
3. 自动包装为 Agent 工具

**为什么用协议而非插件？** 协议合规可验证。不要求贡献者理解 Agent 内部实现。

### 事件扩展（Hooks）

在生命周期关键时刻暴露 hook 点：

| Hook | 时机 | 用途 |
|------|------|------|
| `PreToolUse` | 工具执行前 | 拦截、修改、阻止 |
| `PostToolUse` | 工具执行后 | 观察结果、触发后续 |
| `SessionStart` | 会话启动 | 初始化设置 |
| `UserPromptSubmit` | 用户输入后 | 转换/增强输入 |

**原则**：不暴露内部 API，而是暴露**生命周期事件**让外部进程观察和影响。

### 声明式扩展（Skills）

Markdown 文件在触发时注入 system prompt：
- 通过 description 匹配决定何时触发
- 指令体定义做什么
- 可捆绑参考资源文件

用户可以用声明式方式添加专业知识——不需要写代码。

### 配置分层

```
内建默认值
  ↓ 覆盖
全局用户配置
  ↓ 覆盖
项目配置
  ↓ 覆盖
CLI 参数（本次会话）
  ↓ 不可覆盖
企业管理设置（始终生效）
```

企业层是 bypass-immune——即使 `bypass` 模式也无法覆盖企业管理设置。
