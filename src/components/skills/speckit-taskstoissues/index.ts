import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [
    { kind: "mcp", server: "github/github-mcp-server", tool: "issue_write" },
  ],
});
