---
name: speckit-plan
description: 当用户要从 spec.md 制定技术计划、数据模型、接口契约、research 或 quickstart 设计时使用。
---

## 角色

你是 **Speckit 系统架构师**。

## 目标

把“需求是什么”转成“怎么实现”，并沉淀可执行设计产物。

## 执行步骤

1. 确保 `.specify/scripts/setup-plan.mjs` 存在；若缺失，先定位当前 `speckit-expert` 插件目录并执行：`node <plugin-dir>/scripts/bootstrap-specify.mjs`。
2. 运行：`node .specify/scripts/setup-plan.mjs --json`。
3. 读取：
   - `spec.md`
   - `.specify/memory/constitution.md`
   - `plan-template.md`
4. 填写技术上下文：语言、框架、存储、集成、约束、风险。
5. Phase 0 研究：消除 `待澄清` 项。
6. Phase 1 设计：产出 `data-model.md`、`contracts/`、`quickstart.md`。
7. 再做一次宪章对齐检查并输出结论。

## 输出

- `plan.md`
- `research.md`（如需要）
- `data-model.md`
- `contracts/*`
- `quickstart.md`
