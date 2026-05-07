import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const microsoftDocsSkill = defineSkill({
  id: "microsoft-docs",
  fullName: "microsoft-docs",
  description: "在用户需要理解 Microsoft 技术概念、教程、配置、限制、配额、最佳实践，或编写/调试/评审 Microsoft SDK、.NET、Azure 客户端代码时使用；优先检索 Microsoft Learn 官方内容。",
  useCases: [
    "用户在问“怎么工作”“是什么”“有哪些限制”“怎么配置”“官方最佳实践是什么”。",
    "面向 Azure、.NET、Windows、Microsoft 365、Power Platform、Azure OpenAI 等 Microsoft 技术栈。",
    "适合查概念文档、Quickstart、Tutorial、Quota、Limit、Best practices 和配置手册。",
    "需要从 Microsoft Learn 官方内容中提取可信结论、限制或配置步骤。",
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
    "如果需要具体 SDK API 或示例，是否读取了 `code-reference` reference。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先把查询收窄为产品名、任务意图、版本、平台或语言上下文，不用单个宽泛关键词。",
      "先搜索再抓取：摘要能回答就不抓整页，确认命中和页面相关性后再 fetch。",
      "概念、教程、配置、限制/配额、最佳实践分别用不同查询意图约束结果范围。",
      "microsoft_docs_fetch 只接受文档 URL；section、max-chars 是 CLI fetch 参数，不是 MCP 工具参数。",
      "进入写代码、修 SDK 调用或核对 API 签名时读取 code-reference；CLI 只作为 search/fetch/doctor 回退链路。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "查询词、产品/版本/平台上下文、命中文档 URL 和采用依据。",
      "官方结论、限制、配置步骤、配额、最佳实践和仍需用户确认的上下文。",
      "需要 code-reference 或 CLI 回退的 SDK/API 签名、示例和链路健康结果。",
    ],
  }),
  references: [
    defineReference({
      id: "code-reference",
      source: new URL("./references/code-reference.md", import.meta.url),
      target: "references/code-reference.md",
      title: "code-reference.md",
      summary: "Microsoft SDK 和 API 的代码示例参考，包含常见调用模式和参数配置。",
      loadWhen: "需要具体的 SDK 调用代码、API 签名核对或查看实际使用示例时读取。",
    }),
  ],
});
