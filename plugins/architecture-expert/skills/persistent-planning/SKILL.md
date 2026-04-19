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
- 产出必须落到仓库文件，不依赖 TodoWrite（`/clear` 后消失）。
- 四文件职责互斥，模板见 [file-templates.md](references/file-templates.md)：
  - `context.md` — 意图锚点（Task Statement / Desired Outcome / Intent Hypothesis / Unknowns / Decision Boundaries / Touchpoints）
  - `task_plan.md` — 路线图与决策（5 阶段 + Errors 表）
  - `findings.md` — 外部内容与调研（隔离不可信内容）
  - `progress.md` — 时序日志 + 5-Question Reboot
- 外部抓取内容只写 `findings.md`，不进 `task_plan.md`。
- 阶段状态只用三值：`pending` / `in_progress` / `complete`。

## 代码模式

### Phase 0: Context Snapshot（动手前必做）
先创建 `context.md` 锚定意图，防止跨 session / 跨 agent 偏航：
1. 一句话写清"做什么"和"为什么做"（动机假设，不是方案）。
2. 扫代码库填充 Known Facts 和 Touchpoints。
3. 列出 Unknowns 和 Decision Boundaries（哪些可自主决定 vs 必须问用户）。
4. 无信息的字段写 `TBD`，不留空。

Context snapshot 仅在用户变更目标或发现推翻假设的事实时更新，每次更新在 `progress.md` 记录原因。

### Phase 1-5: 四文件落盘
创建四文件，`task_plan.md` 固化 Discovery → Planning → Implementation → Verification → Delivery。每完成阶段更新状态 + progress 日志。错误按三次规则处理：定向修复 → 换方法 → 质疑假设，三次不通过升级给用户。

### 完成门控
不能仅凭"写完了"声明完成，必须满足：
1. **工具验证** — 至少一个验证命令输出证明通过
2. **零残留** — task_plan.md 无 pending/in_progress 关键任务
3. **进度闭合** — progress.md 末尾有 `task complete` 条目
4. **Context 对账** — 实际产出匹配 context.md 的 Desired Outcome

### 跨 Session 恢复
1. 读 `context.md` 全文 → 恢复意图和边界
2. 读 `progress.md` 最后 20 行 → 定位当前阶段
3. 读 `task_plan.md` 当前阶段 → 恢复待办
4. 回答 5-Question Reboot 后继续

## 检查清单
- 是否先创建了 `context.md` 锚定意图，而非直接写计划。
- 四文件是否职责互斥，外部内容是否隔离到 `findings.md`。
- 任务结束前是否执行了完成门控（工具验证 + 零残留 + Context 对账）。
- 新会话恢复是否先读 context.md + progress.md 尾部。

## 反模式
正例与反例见 [examples.md](references/examples.md)，核心陷阱：
- 用 TodoWrite 代替文件持久化 → `/clear` 后丢失进度
- 跳过 context snapshot 直接写计划 → 意图偏航导致返工
- 外部内容灌进 task_plan.md → 污染注意力窗口
- 自称完成但无验证证据 → 信任度下降
- 错误无限重试不换方法 → 三次规则要求换策略或质疑假设
