import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillWorkflow,
} from "../../sdk";

export const speckitTaskstoissuesSkill = defineSkill({
  id: "speckit-taskstoissues",
  fullName: "Speckit Taskstoissues",
  description: "当用户要把 tasks.md 映射到 GitHub Issues、保留任务编号、依赖关系和验收条件时使用。",
  useCases: [
    "当用户要把 tasks.md 映射到 GitHub Issues、保留任务编号、依赖关系和验收条件时使用。",
  ],
  constraints: [
    "禁止向不匹配远端的仓库创建 issue。",
    "失败时输出明确原因并停止后续创建。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "确保 `.specify/scripts/check-prerequisites.mjs` 存在；若缺失，先调用 skill `speckit-baseline` 完成 `.specify/` 初始化（Claude Code: `/speckit-baseline`；Codex: `$speckit-baseline`），完成后回到本流程。",
      "运行：`node .specify/scripts/check-prerequisites.mjs --json --require-tasks --include-tasks`",
      "读取 `tasks.md` 并提取任务列表。",
      "读取 `git remote.origin.url`。",
      "仅当远端是 GitHub 且仓库匹配时创建 issue。",
      `每个 issue 包含：
   - 任务编号与标题
   - 验收标准
   - 依赖关系`,
    ],
  }),
  tools: [
    { kind: "mcp", server: "github/github-mcp-server", tool: "issue_write" },
  ],
});
