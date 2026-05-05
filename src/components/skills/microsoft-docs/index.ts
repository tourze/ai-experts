import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
  constraints: [
    "查询必须带上产品名、任务意图和必要的版本或平台上下文；不要用过宽泛的关键词。",
    "`microsoft_docs_fetch` 只接受文档 URL；`--section`、`--max-chars` 是 CLI `fetch` 的参数，不是 MCP 工具参数。",
    "优先搜索，确认命中后再抓整页；不要一上来就拉长文档。",
    "CLI 仅作回退链路；已验证的命令只有 `search`、`fetch`、`doctor`。",
  ],
  checklist: [
    "搜索词是否包含产品名、版本、平台或任务意图，而不是只写一个宽词。",
    "是否只在摘要不够时才抓完整页面。",
    "如果需要具体 SDK API 或示例，是否查阅了 `references/code-reference.md`。",
    "是否明确区分了 MCP 工具参数与 CLI 参数。",
    "使用 CLI 回退前，是否可用 `doctor` 快速确认链路健康。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "宽词检索",
      pass: "产品 + 任务 + 版本",
    }),
    defineAntiPattern({
      fail: "无上下文给结论",
      pass: "补全上下文",
    }),
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
