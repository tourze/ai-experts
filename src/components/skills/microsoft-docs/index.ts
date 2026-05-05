import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const microsoftDocsSkill = defineSkill({
  id: "microsoft-docs",
  fullName: "microsoft-docs",
  description: "在用户需要理解 Microsoft 技术概念、教程、配置、限制、配额、最佳实践，或编写/调试/评审 Microsoft SDK、.NET、Azure 客户端代码时使用；优先检索 Microsoft Learn 官方内容。",
  useCases: [
    "用户在问“怎么工作”“是什么”“有哪些限制”“怎么配置”“官方最佳实践是什么”。",
    "面向 Azure、.NET、Windows、Microsoft 365、Power Platform、Azure OpenAI 等 Microsoft 技术栈。",
    "适合查概念文档、Quickstart、Tutorial、Quota、Limit、Best practices 和配置手册。",
    "交叉引用：如果任务已经进入”写代码/修 SDK 调用/核对 API 签名”，查阅 `references/code-reference.md`。",
  ],
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
  ],
});
