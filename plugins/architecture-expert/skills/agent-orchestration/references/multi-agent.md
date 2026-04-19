# 多 Agent 编排

## Agent 定义 Schema

每个 Agent（内建或自定义）由 schema 定义，不是继承：

```
AgentDefinition:
  agent_type: string          # 唯一标识
  when_to_use: string         # 编排模型读取的描述（决定何时 spawn）
  tools: list[str]            # 允许使用的工具（白名单）
  disallowed_tools: list[str] # 禁止使用的工具（黑名单）
  permission_mode: Mode       # 此 Agent 的信任级别
  isolation: none | worktree  # 文件系统隔离
  model: string               # 可与编排器不同
  max_turns: int              # 防止失控
  system_prompt: str | fn     # Agent 专用 system prompt
  background: bool            # 是否可后台运行
```

## Fork vs Fresh 决策

这是多 Agent 设计中最重要的架构决策。

### Fork（上下文继承）

- 继承父 Agent 的 system prompt 字节
- 共享父 Agent 的 prompt cache（大幅节省 API 成本）
- 获得父 Agent 的工具集和上下文
- 启动快、运行便宜
- **适用**：并行研究任务、需要父上下文的任务

### Fresh（独立隔离）

- 使用自己的 system prompt
- 不与父 Agent 共享缓存
- 自定义工具集，可以更受限
- 文件系统状态隔离（可选）
- **适用**：高风险操作、不同任务领域、需要 worktree 隔离

### 决策规则

```
任务需要父上下文 AND 是研究/探索       → Fork
任务涉及写操作 AND 父 Agent 不信任输出  → Fresh
任务需要文件系统隔离                    → Fresh + worktree
任务是即发即忘                          → Fresh + background: true
```

## Worktree 隔离

对会修改文件系统的子 Agent，放入 git worktree——同一仓库的独立 checkout，在新分支上。

**优势**：
- 父 Agent 可继续工作，子 Agent 并行
- 变更可审计（diff 分支）
- 可回滚（删除分支即可）
- 无合并冲突

**适用**：任何会做用户尚未批准的写操作的子 Agent；推测性代码生成。

## 后台执行 + 任务跟踪

长时间运行的 Agent 应在超时后自动迁移到后台（如 ~120 秒）：

1. 创建 Task 记录：agent_id, status (running/done/failed), output_path
2. 任务独立运行
3. 用户可查询状态、读取部分输出、取消
4. 完成后输出持久化到磁盘（不留在父上下文中）

```python
# ❌ 阻塞
result = agent.run(task)           # 阻塞 10 分钟

# ✅ 非阻塞
task_id = agent.spawn_background(task)
# 继续其他工作...
result = await agent.get_result(task_id)  # 需要时再查
```

## Agent 间通信

- 消息传递工具用于 Agent 间通信
- 编排器可向运行中的子 Agent 发送消息
- 子 Agent 可向编排器推送状态更新
- 团队协作场景：命名 Agent 组 + 共享消息频道
