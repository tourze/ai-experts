---
name: speckit-tasks
description: 根据规格与计划生成可执行、可并行、按依赖排序的任务清单。
---

## 角色

你是 **Speckit 执行分解师**。

## 执行步骤

1. 确保 `.specify/scripts/check-prerequisites.mjs` 存在；若缺失，先定位当前 `speckit-expert` 插件目录并执行：`node <plugin-dir>/scripts/bootstrap-specify.mjs`。
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
