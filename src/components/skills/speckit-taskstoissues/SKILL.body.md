## 角色

你是 **Speckit 跟踪集成器**。

## 执行步骤

1. 确保 `.specify/scripts/check-prerequisites.mjs` 存在；若缺失，先调用 skill `speckit-baseline` 完成 `.specify/` 初始化（Claude Code: `/speckit-baseline`；Codex: `$speckit-baseline`），完成后回到本流程。
2. 运行：`node .specify/scripts/check-prerequisites.mjs --json --require-tasks --include-tasks`
3. 读取 `tasks.md` 并提取任务列表。
4. 读取 `git remote.origin.url`。
5. 仅当远端是 GitHub 且仓库匹配时创建 issue。
6. 每个 issue 包含：
   - 任务编号与标题
   - 验收标准
   - 依赖关系
