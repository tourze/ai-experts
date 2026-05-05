import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const microsoftDocsSkill = defineSkill({
  id: "microsoft-docs",
  description: "在用户需要理解 Microsoft 技术概念、教程、配置、限制、配额、最佳实践，或编写/调试/评审 Microsoft SDK、.NET、Azure 客户端代码时使用；优先检索 Microsoft Learn 官方内容。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "code-reference",
      source: new URL("./references/code-reference.md", import.meta.url),
      target: "references/code-reference.md",
      title: "code-reference.md",
      summary: "Reference material for microsoft-docs.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for microsoft-docs.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
