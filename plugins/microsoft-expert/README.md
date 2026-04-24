# microsoft-expert

面向 Microsoft 生态问题排查与代码落地的插件，覆盖 Microsoft Learn 官方文档检索与 SDK API/示例校验。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
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
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
node --check hooks/dispatch.mjs
npx -y @microsoft/learn-cli doctor --format json
```

`learn-cli` 健康检查不再通过 SessionStart 自动执行（8s timeout + 非 MS 项目下必然失败，会触发 SessionStart schema 校验错误）。需要时手动跑最后一行命令即可。

## 安装

```bash
claude --plugin-dir /path/to/plugins/microsoft-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install microsoft-expert@ai-experts
claude plugin install microsoft-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall microsoft-expert
claude plugin uninstall microsoft-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

优先使用 Microsoft Learn MCP 工具；`mslearn` CLI 只作为回退链路，其健康检查改为按需手动执行。
