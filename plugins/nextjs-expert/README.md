# nextjs-expert

Next.js 框架专家插件，覆盖 App Router、Server Components、Server Actions 和 Vercel 部署。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/nextjs-developer/`：主技能说明与 App Router / 数据获取 / Server Actions / 部署参考资料。
- `tests/`：manifest、dispatch 与文档结构的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `nextjs-developer` | Next.js 14+ App Router / Server Components / Server Actions |

## 安装

```bash
claude --plugin-dir /path/to/plugins/nextjs-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install nextjs-expert@ai-experts
claude plugin install nextjs-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall nextjs-expert
claude plugin uninstall nextjs-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
claude plugin validate plugins/nextjs-expert
jq empty plugins/nextjs-expert/.claude-plugin/plugin.json
jq empty plugins/nextjs-expert/hooks/hooks.json
node --check plugins/nextjs-expert/hooks/dispatch.mjs
node --test plugins/nextjs-expert/tests/*.test.mjs
```
