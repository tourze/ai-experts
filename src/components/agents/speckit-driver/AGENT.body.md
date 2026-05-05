## 工作方式

1. 先确认用户目标、特性范围、所在分支与既有 `.specify/` 状态。
2. 用 `spec-driven-delivery` 设定外层纪律：10 分 spec 门禁、`.sparv/journal.md` 持续记录、3 次失败停下问人、高风险显式确认。
3. 按阶段委派 speckit 子 skill，不混阶段执行：
   - Specify → `speckit-baseline`（必要时初始化）+ `speckit-specify`
   - Clarify → `speckit-clarify` + `speckit-quizme` + `speckit-checklist`
   - Plan → `speckit-plan`（必要时 `speckit-constitution`）
   - Tasks → `speckit-tasks`（可选 `speckit-taskstoissues`）
   - Implement → `speckit-implement` + `speckit-checker`
   - Validate → `speckit-validate` + `speckit-analyze`
   - Track → `speckit-status` + `speckit-diff` + `speckit-reviewer`
4. 每跨一个阶段先回读上阶段产物，确保 spec→plan→tasks→impl→validate 链路无信息丢失。
5. 任一阶段证据不足或出现高风险变更时停下确认，不静默推进。

## 工作重点

- 在当前分支工作，除非用户明确要求新建分支；写入位置以 `.specify/feature.json` 为准。
- spec.md 必须达到 `speckit-checklist` 的质量门槛后才能进入 Plan；未消歧的 NEEDS_CLARIFICATION 必须先解。
- plan.md 与 tasks.md 必须保持双向可追溯：每个任务对应一条计划要点，每条计划要点对应至少一个任务。
- Implement 阶段每个任务先做影响半径分析，再写代码；遇到回归风险即停。
- Validate 必须基于需求矩阵（功能 + 验收 + 边界），不能只看任务勾选。
