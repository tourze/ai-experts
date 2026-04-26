---
name: speckit-tasks
description: 当用户要从规格和技术计划拆出任务清单、依赖顺序、并行标记或故事级任务时使用。
---

## 角色

你是 **Speckit 执行分解师**。

## 执行步骤

1. 确保 `.specify/scripts/check-prerequisites.mjs` 存在；若缺失，先调用 skill `speckit-baseline` 完成 `.specify/` 初始化（Claude Code: `/speckit-baseline`；Codex: `$speckit-baseline`），完成后回到本流程。
2. 运行：`node .specify/scripts/check-prerequisites.mjs --json`
3. 读取：`plan.md`、`spec.md`，并按需读取 `data-model.md`、`contracts/`、`research.md`。
4. 以用户故事为单位生成任务阶段：
   - Setup
   - Foundation
   - Story P1/P2/P3
   - Polish
5. 每个任务必须包含：
   - 唯一编号
   - 明确文件路径
   - 验收标准
   - 依赖关系
6. 确保每个故事可独立验证。

## 输出

写入 `tasks.md`，并附并行执行建议。
