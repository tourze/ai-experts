# 四文件模板

## context.md

```markdown
# Context Snapshot
**Created:** <YYYY-MM-DD HH:MM>  **Last Updated:** <YYYY-MM-DD HH:MM>

## Task Statement
<一句话描述做什么>

## Desired Outcome
<完成后的状态是什么样>

## Intent Hypothesis
<用户为什么要做这件事——动机，不是方案>

## Known Facts / Evidence
- <已确认的事实，附文件路径或命令输出>

## Constraints
- <技术约束、时间约束、兼容性要求>

## Unknowns / Open Questions
- <需要验证或询问用户的未知项>

## Decision Boundaries
- **可自主决定:** <列举>
- **必须问用户:** <列举>

## Codebase Touchpoints
- <预计需要修改/读取的文件和模块>
```

## task_plan.md

```markdown
# <Task Title>
**Goal:** <一句话目标>  **Current Phase:** <phase-name>
**Context:** 见 context.md

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
|-------|---------|------------|
```

## findings.md

```markdown
# Findings
## Research
- <来源 URL / 文件路径>: <摘要>
## Visual/Browser Findings
- <截图/页面描述转文字>
## Technical Decisions
- <决策点>: <选项对比>
```

## progress.md

```markdown
# Progress Log
[YYYY-MM-DD HH:MM] session start — goal: <从 context.md 复制一行>
[YYYY-MM-DD HH:MM] phase 1 → in_progress
[YYYY-MM-DD HH:MM] phase 1 → complete (见 findings.md#research)

## 5-Question Reboot
1. Where am I? — 当前阶段和最后完成的动作
2. Where am I going? — 下一个待完成的任务
3. What's the goal? — context.md 的 Desired Outcome
4. What have I learned? — 最重要的 1-2 个发现
5. What have I done? — 已完成的阶段列表
```
