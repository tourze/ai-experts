# persistent-planning 示例

## 示例 1：跨会话修复任务

- `context.md`：写清“修复构建失败并保证回归通过”。
- `task_plan.md`：按 Discovery/Implementation/Verification 分阶段。
- `findings.md`：记录错误日志来源和关键证据。
- `progress.md`：每次关键动作留时间戳。

## 示例 2：并行子任务

在 `task_plan.md` 把任务拆成多个并行分支，每条分支写：
- owner
- read scope
- write scope
- acceptance

## 示例 3：完成门控

结束前至少满足：
- 有验证命令和结果
- 关键任务无 `pending` / `in_progress`
- `progress.md` 最后一条为完成记录
