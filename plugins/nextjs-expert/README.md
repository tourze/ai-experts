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

## 验证

```bash
claude plugin validate plugins/nextjs-expert
jq empty plugins/nextjs-expert/.claude-plugin/plugin.json
jq empty plugins/nextjs-expert/hooks/hooks.json
node --check plugins/nextjs-expert/hooks/dispatch.mjs
node --test plugins/nextjs-expert/tests/*.test.mjs
```
