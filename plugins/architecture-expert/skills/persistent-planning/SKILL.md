---
name: persistent-planning
description: "在多轮、跨 session 的复杂任务中，把计划、发现和进度持久化到仓库文件而不是 TodoWrite 时使用。"
---

# persistent-planning

## 适用场景
- 适合 3+ 步骤、跨多次工具调用、或预期会被 `/clear` 打断的任务。
- 适合需要在下一次会话里继续追进度、回看决策的中长期工作。
- 交叉引用：过程骨架用 `feature-dev`；任务拆解用 `task-decomposer`；方案风险审计用 `plan-review`。

## 核心约束
- 计划产出必须落到仓库文件，不要只依赖 TodoWrite——后者在 `/clear` 后消失。
- 三文件职责互斥：`task_plan.md` 只放路线图与决策，`findings.md` 接收外部内容与调研，`progress.md` 记时序日志与错误。
- 外部抓取/粘贴的不可信内容只写进 `findings.md`，绝不直接写进 `task_plan.md`（避免被 hook 反复注入 context）。
- 每执行 2 次 view/search/browser 操作，立即把关键发现落到 `findings.md`，不要等上下文轮换后再回忆。
- 阶段状态只用三值：`pending` / `in_progress` / `complete`，便于脚本化统计完成率。

## 代码模式
- 任务开始先创建三文件（模板见下方"三文件模板"），在 `task_plan.md` 固化 5 个阶段：Discovery → Planning → Implementation → Verification → Delivery。
- 每完成一个阶段，更新 `task_plan.md` 状态字段 + 在 `progress.md` 追加一行 `[timestamp] phase X complete`。
- 遇到错误按"三次规则"：Attempt 1 定位根因并定向修复，Attempt 2 换方法，Attempt 3 质疑假设/更新计划；三次仍不通过则升级给用户。

### 三文件模板（精简版）

`task_plan.md`：
```markdown
# <Task Title>
**Goal:** <一句话目标>  **Current Phase:** <phase-name>

## Phase 1: Discovery  **Status:** pending
- [ ] <具体动作>

## Phase 2: Planning   **Status:** pending
## Phase 3: Implementation **Status:** pending
## Phase 4: Verification **Status:** pending
## Phase 5: Delivery     **Status:** pending

## Decisions
- <日期>: <决策> — <理由>

## Errors & Rethinks
| Error | Attempt | Resolution |
```

`findings.md`：
```markdown
# Findings
## Research
- <来源 URL / 文件路径>: <摘要>
## Visual/Browser Findings
- <截图/页面描述转文字>
## Technical Decisions
- <决策点>: <选项对比>
```

`progress.md`：
```markdown
# Progress Log
[2026-04-18 10:00] session start — goal: <>
[2026-04-18 10:15] phase 1 → in_progress
[2026-04-18 11:02] phase 1 → complete (见 findings.md#research)

## 5-Question Reboot
- Where am I? / Where am I going? / What's the goal? / What have I learned? / What have I done?
```

## 检查清单
- 是否在动手前创建了三文件，而不是直接开写。
- 是否把外部抓取内容隔离到 `findings.md`，没有污染 `task_plan.md`。
- 阶段状态是否只用 pending/in_progress/complete 三值。
- 任务结束前是否回答了 `progress.md` 底部的 5 个重启问题。

## 反模式

### FAIL: 用 TodoWrite 做持久化

```
用户："帮我重构认证模块"
→ 调 TodoWrite 写 8 条 todo → 做到第 3 条用户 /clear
→ 新会话里 todo 列表消失，只能重新问"我们上次做到哪了"
```

### PASS: 三文件落盘

```
→ 新建 task_plan.md（5 阶段）+ findings.md + progress.md
→ /clear 后新会话自动通过 SessionStart 读到三文件 → 立即知道 phase 3 进行中
```

### FAIL: 把外部内容灌进 task_plan.md

```
web_fetch 了一篇 10KB 博客 → 贴进 task_plan.md 的 "References" 节
→ 每次 PreToolUse 刷计划时都把博客塞进 context → 污染注意力窗口
```

### PASS: 外部内容隔离到 findings.md

```
task_plan.md 只记一行："见 findings.md#auth-lib-comparison"
findings.md 才存博客摘要 + URL
→ 计划文件保持精简，刷新成本可控
```

### FAIL: 错误无限重试

```
npm test 失败 → 再跑一次 → 还是失败 → 再跑一次（第 5 次）
→ 没记错误、没换方法、没更新计划
```

### PASS: 三次规则 + 错误日志

```
Attempt 1: 读错误信息 → 定位到 jest config → 修 moduleNameMapper
Attempt 2: 还失败 → 换策略：先隔离单测
Attempt 3: 还失败 → 质疑 "jest 是否适合这个场景" → 更新计划改用 vitest
→ 每次都在 task_plan.md 的 Errors 表追加一行
```
