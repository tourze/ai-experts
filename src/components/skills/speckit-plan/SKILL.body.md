## 目标

把“需求是什么”转成“怎么实现”，并沉淀可执行设计产物。

## 执行步骤

1. 确保 `.specify/scripts/setup-plan.mjs` 存在；若缺失，先调用 skill `speckit-baseline` 完成 `.specify/` 初始化（Claude Code: `/speckit-baseline`；Codex: `$speckit-baseline`），完成后回到本流程。
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
