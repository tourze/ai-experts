# microsoft-docs

## 适用场景

- 用户在问“怎么工作”“是什么”“有哪些限制”“怎么配置”“官方最佳实践是什么”。
- 面向 Azure、.NET、Windows、Microsoft 365、Power Platform、Azure OpenAI 等 Microsoft 技术栈。
- 适合查概念文档、Quickstart、Tutorial、Quota、Limit、Best practices 和配置手册。
- 交叉引用：如果任务已经进入”写代码/修 SDK 调用/核对 API 签名”，查阅 `references/code-reference.md`。

## 核心约束

- 查询必须带上产品名、任务意图和必要的版本或平台上下文；不要用过宽泛的关键词。
- `microsoft_docs_fetch` 只接受文档 URL；`--section`、`--max-chars` 是 CLI `fetch` 的参数，不是 MCP 工具参数。
- 优先搜索，确认命中后再抓整页；不要一上来就拉长文档。
- CLI 仅作回退链路；已验证的命令只有 `search`、`fetch`、`doctor`。

## 代码模式

- 先搜再抓，搜索词要包含明确上下文。

```text
microsoft_docs_search(query: "Azure Functions Python v2 programming model")
microsoft_docs_search(query: "Cosmos DB partition key design best practices")
microsoft_docs_search(query: "Service Bus quotas")
microsoft_docs_fetch(url: "https://learn.microsoft.com/en-us/azure/developer/python/sdk/authentication/system-assigned-managed-identity")
```

- 如果需要回退到 CLI，使用已验证命令：

```bash
npx -y @microsoft/learn-cli search "Azure Functions Python v2 programming model"
npx -y @microsoft/learn-cli fetch --max-chars 240 "https://learn.microsoft.com/en-us/azure/developer/python/sdk/authentication/system-assigned-managed-identity"
npx -y @microsoft/learn-cli doctor --format json
```

- 用查询意图约束结果范围：

| 目标 | 查询写法 |
|------|----------|
| 概念理解 | `"Cosmos DB partitioning overview"` |
| 教程/上手 | `"Azure Functions Python quickstart"` |
| 配置选项 | `"App Service configuration settings"` |
| 限制/配额 | `"Azure OpenAI rate limits"` |
| 最佳实践 | `"Azure security best practices"` |

## 检查清单

- 搜索词是否包含产品名、版本、平台或任务意图，而不是只写一个宽词。
- 是否只在摘要不够时才抓完整页面。
- 如果需要具体 SDK API 或示例，是否查阅了 `references/code-reference.md`。
- 是否明确区分了 MCP 工具参数与 CLI 参数。
- 使用 CLI 回退前，是否可用 `doctor` 快速确认链路健康。

## 反模式

### FAIL: 宽词检索

```text
microsoft_docs_search(query: "Azure")
→ 返回 200+ 无关条目
```

### PASS: 产品 + 任务 + 版本

```text
microsoft_docs_search(query: "Azure Functions Python v2 timer trigger")
→ 返回精确匹配的 quickstart
```

### FAIL: 无上下文给结论

```
用户："Azure OpenAI 有配额限制吗？"
你："有，每分钟 6 万 tokens"
→ 用户："我用的是什么模型？哪个区域？"
→ 答不上
```

### PASS: 补全上下文

```
先问/确认：模型 / region / SKU
微软 docs_search("Azure OpenAI gpt-4o rate limits {region}")
→ 给出该 region + 该模型的真实配额 + 原文链接
```

## 扩展参考

- [`references/code-reference.md`](references/code-reference.md)：写代码、修 SDK 调用、核对 API 签名与官方示例的详细流程和反模式。当任务从"理解概念"进入"写代码 / 修 SDK 错误"时查阅。
