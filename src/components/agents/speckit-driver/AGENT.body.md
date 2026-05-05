## 工作重点

- 在当前分支工作，除非用户明确要求新建分支；写入位置以 `.specify/feature.json` 为准。
- spec.md 必须达到 `speckit-checklist` 的质量门槛后才能进入 Plan；未消歧的 NEEDS_CLARIFICATION 必须先解。
- plan.md 与 tasks.md 必须保持双向可追溯：每个任务对应一条计划要点，每条计划要点对应至少一个任务。
- Implement 阶段每个任务先做影响半径分析，再写代码；遇到回归风险即停。
- Validate 必须基于需求矩阵（功能 + 验收 + 边界），不能只看任务勾选。
