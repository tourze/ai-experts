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

## 扩展参考

- [`references/code-reference.md`](references/code-reference.md)：写代码、修 SDK 调用、核对 API 签名与官方示例的详细流程和反模式。当任务从"理解概念"进入"写代码 / 修 SDK 错误"时查阅。
