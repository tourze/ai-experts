# microsoft-expert

面向 Microsoft 生态问题排查与代码落地的插件，覆盖 Microsoft Learn 官方文档检索与 SDK API/示例校验。

## 目录结构

- `hooks/`：`hooks.json`（当前无注册 hook）与 `dispatch.mjs`（保留以备将来扩展）。
- `skills/`：`microsoft-docs` 与 `microsoft-code-reference` 两个技能。

## Skills

| Skill | 用途 |
|-------|------|
| `microsoft-code-reference` | 写代码、修 SDK 错误、核对 API/签名/官方示例 |
| `microsoft-docs` | 查概念、教程、配置、配额、限制与最佳实践 |

## 验证命令

在插件目录执行：

```bash
claude plugin validate .
jq empty hooks/hooks.json
node --check hooks/dispatch.mjs
npx -y @microsoft/learn-cli doctor --format json
```

`learn-cli` 健康检查不再通过 SessionStart 自动执行（8s timeout + 非 MS 项目下必然失败，会触发 SessionStart schema 校验错误）。需要时手动跑最后一行命令即可。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

