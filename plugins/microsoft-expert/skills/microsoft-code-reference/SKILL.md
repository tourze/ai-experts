---
name: microsoft-code-reference
description: "在编写、调试或评审 Microsoft SDK、.NET、Azure 客户端或 Microsoft API 代码时使用。"
context: fork
compatibility: "优先使用 Microsoft Learn MCP Server（https://learn.microsoft.com/api/mcp）；不可用时回退到 `mslearn` CLI（`npx -y @microsoft/learn-cli`）。"
---

# microsoft-code-reference

## 适用场景

- 用户正在写或修 Microsoft 相关代码：Azure SDK、.NET/BCL、Microsoft Graph、Windows API、Power Platform SDK 等。
- 用户报 `method not found`、`type not found`、签名不匹配、弃用迁移、鉴权或 RBAC 错误。
- 需要用官方示例压实调用方式，防止 AI 凭记忆幻觉出不存在的 API。
- 交叉引用：如果用户主要在理解概念、教程、配置或配额，改用 `microsoft-docs`。

## 核心约束

- 先查官方 API/示例，再写代码；不要凭记忆补全 Microsoft SDK 方法名。
- API 名称、命名空间或包名、版本语境必须一起核对，尤其注意 v11/v12、同步/异步、.NET/Java/Python/JavaScript 差异。
- `microsoft_docs_fetch` 只在搜索摘要不够、需要 overload 或完整参数时使用，不要无差别抓整页。
- CLI 仅作回退链路；不要虚构 CLI 子命令。已验证的命令只有 `search`、`fetch`、`code-search`、`doctor`。

## 代码模式

- 先做三步校验：API 存在性 → 完整签名 → 官方示例。

```text
microsoft_docs_search(query: "BlobClient UploadAsync Azure.Storage.Blobs")
microsoft_docs_fetch(url: "https://learn.microsoft.com/dotnet/api/azure.storage.blobs.blobclient.uploadasync?view=azure-dotnet")
microsoft_code_sample_search(query: "upload blob managed identity", language: "python")
```

- 遇到错误时，按问题类型组织查询，而不是直接拍脑袋改代码。

| 场景 | 查询模式 |
|------|----------|
| 方法不存在 | `"[ClassName] [MethodName] [Namespace]"` |
| 类型或命名空间不存在 | `"[TypeName] package namespace"` |
| 签名不匹配 | `"[ClassName] [MethodName] overloads"`，然后抓完整页面 |
| 弃用迁移 | `"[OldType] migration"` |
| 鉴权失败 | `"DefaultAzureCredential troubleshooting"` |
| 权限/RBAC 报错 | `"[ServiceName] RBAC permissions"` |

- CLI 回退链路使用已验证命令：

```bash
npx -y @microsoft/learn-cli search "BlobClient UploadAsync Azure.Storage.Blobs"
npx -y @microsoft/learn-cli code-search --language python "upload blob managed identity"
npx -y @microsoft/learn-cli fetch --section "Definition" --max-chars 300 "https://learn.microsoft.com/dotnet/api/azure.storage.blobs.blobclient.uploadasync?view=azure-dotnet"
npx -y @microsoft/learn-cli doctor --format json
```

## 检查清单

- 是否先确认类、方法、包名或命名空间真实存在。
- 是否区分了 SDK 大版本、同步/异步重载和语言差异。
- 是否对复杂调用抓取了完整签名，而不是只看搜索摘要。
- 是否找到同语言的官方示例，再据此生成或修复代码。
- 如果改动本质上是概念解释而不是代码实现，是否切换到 `microsoft-docs`。

## 反模式

### FAIL: 凭记忆写 SDK

```csharp
// 凭印象写：
BlobClient.UploadAsync(stream, overwrite: true);
// 实际新版签名：UploadAsync(Stream, BlobUploadOptions)
// 编译报错
```

### PASS: 先查再写

```text
microsoft_code_sample_search(query: "BlobClient UploadAsync", language: "csharp")
→ 基于官方示例复制签名
```

### FAIL: 混用新旧 SDK

```csharp
// v11 旧包
using Microsoft.Azure.Storage.Blob;
// v12 新包
using Azure.Storage.Blobs;
// 同一项目混用 → 两套概念 / 难以排查
```

### PASS: 锁定一个 major 版本

```text
microsoft_docs_search("Azure Storage SDK migration v11 to v12")
// 明确迁移到 v12 → 移除 v11 引用
```
