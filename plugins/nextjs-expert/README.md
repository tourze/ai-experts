# nextjs-expert

Next.js 框架专家插件，覆盖 App Router、Server Components、Server Actions 和 Vercel 部署。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/dependency-check.mjs`。
- `skills/nextjs-developer/`：主技能说明与 App Router / 数据获取 / Server Actions / 部署参考资料。
- `tests/`：manifest、dispatch、依赖提示与文档结构的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `nextjs-developer` | Next.js 14+ App Router / Server Components / Server Actions |

## 安装

```bash
claude --plugin-dir /path/to/plugins/nextjs-expert
```

建议同时安装 `react-expert`、`typescript-expert`、`javascript-expert` 插件；本插件会在 `SessionStart` 时检查这些配套插件是否可见，并以非阻塞方式提示缺失项。

## 验证

```bash
claude plugin validate plugins/nextjs-expert
jq empty plugins/nextjs-expert/.claude-plugin/plugin.json
jq empty plugins/nextjs-expert/hooks/hooks.json
node --check plugins/nextjs-expert/hooks/dispatch.mjs
node --check plugins/nextjs-expert/hooks/session-start/dependency-check.mjs
node --test plugins/nextjs-expert/tests/*.test.mjs
```
