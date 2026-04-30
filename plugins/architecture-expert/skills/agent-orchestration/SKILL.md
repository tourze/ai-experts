---
name: agent-orchestration
description: "当用户要设计多 Agent 编排、system prompt 架构、状态管理或 Agent 扩展点时使用。"
---

# Agent Orchestration

## 适用场景

- 设计多 Agent 系统：子 Agent 职责划分、fork vs fresh 决策、隔离策略。
- 构建 system prompt 架构：静态/动态分离、缓存边界、模块化段函数。
- 设计 Agent 状态管理：四种状态生命周期、层级配置、记忆提取。
- 规划 Agent 扩展点：协议（MCP）、事件（Hooks）、声明式（Skills）。
- 需要与 [agent-tool-design](../agent-tool-design/SKILL.md) 联动做工具加载策略。

## 核心约束

- **铁律：Fork vs Fresh 必须显式决策**——子 Agent 继承父上下文（fork）还是独立启动（fresh）不能隐含，必须按风险和隔离需求明确选择。
- System prompt 必须有缓存边界：静态段在前（可缓存），动态段在后，两者不能混排。
- 每个 Agent 必须有 `max_turns` 限制，防止无限循环。
- 状态按生命周期分四层（turn/session/persistent/project），禁止混用。
- 扩展通过协议和事件，不通过继承或核心代码修改。

## 实施步骤

### 步骤 1：设计 System Prompt 架构

按静态/动态分离构建 prompt，详见 [references/system-prompt.md](references/system-prompt.md)。

### 步骤 2：定义 Agent 类型和编排模式

为每种子 Agent 填充定义 schema，选择 fork/fresh/worktree 隔离级别，详见 [references/multi-agent.md](references/multi-agent.md)。

### 步骤 3：设计状态管理和扩展点

按四层生命周期分配状态存储，规划 hook 点和协议接口，详见 [references/state-extensibility.md](references/state-extensibility.md)。

## 代码模式

### FAIL: 单体 prompt 字符串

```python
PROMPT = f"""You are an assistant. Today is {date.today()}.
Rules: ... Tools: ... Style: ..."""
```

→ 日期每天变 → 缓存每天失效；改一条规则要改整个字符串。

### PASS: 模块化段函数 + 缓存边界

```python
prompt = [
    intro_section(),          # 静态：角色定义
    rules_section(),          # 静态：操作规则
    tool_usage_section(),     # 静态：工具使用指南
    CACHE_BOUNDARY,           # ─── 缓存边界 ───
    env_section(ctx),         # 动态：环境信息
    memory_section(user),     # 动态：用户记忆
]
```

→ 静态段跨请求缓存，节省 60-80% prompt token；每段可独立测试/替换。

### FAIL: 所有子 Agent 共享状态

```python
agent_a.run(shared_state)  # ❌ 竞态条件
agent_b.run(shared_state)  # 两个 Agent 同时修改
```

### PASS: 隔离 + 消息传递

```python
task = agent.spawn(isolation="worktree")  # ✅ 独立文件系统
result = await task.get_result()           # 完成后读取结果
```

→ 无竞态；变更可审计（diff 分支）；可回滚（删除分支）。

## 验证清单

- [ ] System prompt 是否有明确的缓存边界？静态段是否真正不变？
- [ ] 每个子 Agent 是否有 `max_turns` 限制？
- [ ] fork/fresh 决策是否有明确理由（而非默认值）？
- [ ] 四种状态（turn/session/persistent/project）是否分别用了合适的存储？
- [ ] 后台 Agent 是否有任务跟踪机制（状态查询、取消、输出持久化）？
- [ ] 扩展点是否通过协议/事件暴露，而非要求改核心代码？
- [ ] 每个 prompt 段是否可独立测试？

## 反模式

- **隐式 fork**：子 Agent 默认继承父上下文 → 风险操作污染父状态，无法回滚。
- **无 max_turns**：Agent 陷入循环时无熔断 → 无限消耗 token 和时间。
- **阻塞等待子 Agent**：长任务阻塞主循环 → 用户体验差。应用后台执行 + 任务跟踪。
- **单体 prompt 字符串**：不可缓存、不可测试、不可替换，每次改动都是手术。
