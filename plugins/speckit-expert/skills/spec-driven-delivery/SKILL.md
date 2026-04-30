---
name: spec-driven-delivery
description: "当需要把需求、计划、实现、审查和沉淀串成可验证交付流程，避免过早实现或跑偏时使用。"
---

# 需求驱动的可验证交付（SPARV）

## 适用场景

- 不是"改一行"的改动，需要把需求→实现→验证串起来一次走完。
- 跨多次工具调用、可能跨 session，担心中途遗忘决策或跳过验证。

## 与 speckit 子流程的关系（外层纪律 vs 内层动作）

本 skill 是**外层纪律层**，与 speckit 子流程是包裹关系，不是替代。

| Phase | 委派给 |
|---|---|
| 1 Specify | `speckit-specify` 写 spec.md；`speckit-clarify` / `speckit-quizme` 消歧；`speckit-checklist` 补质量清单 |
| 2 Plan | `speckit-plan` 出技术计划；`speckit-tasks` 拆原子任务 |
| 3 Act | `speckit-implement` 按 tasks.md 执行 |
| 4 Review | `speckit-validate` 需求矩阵；`speckit-reviewer` 代码审查；`speckit-analyze` 一致性 |
| 5 Vault | speckit 无对应物，由本 skill 的 `.sparv/kb.md` 兜住 |

其他交叉引用：`architecture-expert:task-decomposer` / `feature-dev` / `persistent-planning`、`coding-expert:verification-before-completion`、`git-expert:finishing-branch`。

## Iron Law

```
Spec 不达标不计划，计划没落实不执行，执行没验证不收尾
```

- Spec 门禁分数未达标 → 不进入 Plan。
- 没有可验证的验收标准 → 不进入 Act。
- 没有新鲜证据 → 不进入 Vault。
- 同任务连续 3 次失败 → 停下问用户，不无限重试。
- 高风险（生产/敏感数据/破坏性/计费/安全关键）→ 进入 Act 前拿用户显式 "yes"，并写进 journal。

## 五阶段（精简）

### Phase 1 — Specify（10 分门禁）

- 五维评分（Value / Scope / Acceptance / Boundaries / Risk）各 0/1/2 分，**总分 ≥9** 才能进入 Plan。详见 `references/scoring-rubric.md`。
- 任何维度 0 分 → 在 `.sparv/journal.md` 写 `UNCERTAIN: ... | ASSUMPTION: ...`，或给用户 2-3 个选项。
- 出口写下一句"完成承诺"（可验证的完成陈述）。

### Phase 2 — Plan

- 拆 2-5 分钟粒度原子任务，每条带验证命令与依赖顺序，写入 journal `## Plan` 段。
- **Quick 模式**：spec ≥9 + 影响文件 ≤3 + 无高风险 → 可跳过 Plan 直接 Act，但 Review 不能跳。

### Phase 3 — Act

- 按 Plan 执行，每个任务结束立刻跑验证命令。
- 每 2 次工具调用在 journal 追加进度（格式见 `references/journal-format.md`）。
- 失败处理：1 次调整重试 → 2 次换角度补上下文 → 3 次停下问用户。

### Phase 4 — Review

- 对照"完成承诺"和 Plan 逐条核对，所有验收标准必须有新鲜证据。
- Plan 之外的"顺手改动"要么回退要么写进 journal。
- 至少跑一次完整测试套件防回归。审查失败回 Phase 3，不跳 Vault。

### Phase 5 — Vault

把可复用的归档到 `.sparv/kb.md`：Patterns / Decisions / Gotchas。下次再来时 Phase 1 先翻 kb。

## 外部记忆约定

不依赖任何 hook，`.sparv/` 三件套就是跨 session 记忆：

```
.sparv/
├── state.yaml      # session_id / current_phase / action_count / consecutive_failures / completion_promise
├── journal.md      # Plan / Progress / Findings 全在这
└── kb.md           # Vault 阶段写入
```

完整字段、journal 条目格式、EHRB 触发清单见 `references/journal-format.md`。

## 阶段门禁与 Red Flags

每阶段出口的完整 checklist、以及"出现这些念头立即停下"的 Red Flags 表见 `references/checklists.md`。

## 适用范围

任何不是一行字就能改完的工作。小改动走 Quick 模式（Specify→Act→Review），仍走五阶段心智模型。
