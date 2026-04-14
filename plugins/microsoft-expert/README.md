# microsoft-expert

面向 Microsoft 生态问题排查与代码落地的插件，覆盖 Microsoft Learn 官方文档检索、SDK API/示例校验，以及 `mslearn` CLI 回退链路自检。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单、skills 路径与 hook 注册。
- `hooks/`：`hooks.json`、`dispatch.mjs` 和 `session-start/learn-cli-check.mjs`。
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
node --check hooks/session-start/learn-cli-check.mjs
node hooks/dispatch.mjs session-start </dev/null
npx -y @microsoft/learn-cli doctor --format json
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/microsoft-expert
```

优先使用 Microsoft Learn MCP 工具；`mslearn` CLI 只作为回退链路。SessionStart hook 仅做健康检查并报告异常，不会阻塞插件使用。
