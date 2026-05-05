import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const speckitTaskstoissuesSkill = defineSkill({
  id: "speckit-taskstoissues",
  description: "当用户要把 tasks.md 映射到 GitHub Issues、保留任务编号、依赖关系和验收条件时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: ["['github/github-mcp-server/issue_write']"],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for speckit-taskstoissues.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
