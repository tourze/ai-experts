# nextjs-expert

Next.js 框架专家插件，覆盖 App Router、Server Components、Server Actions 和 Vercel 部署。

## 结构

- `hooks/`：1 个 PostToolUse Edit\|Write 守卫。
- `skills/nextjs-developer/`：主技能说明与 App Router / 数据获取 / Server Actions / 部署参考资料。
- `tests/`：文档结构与最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `nextjs-developer` | Next.js 14+ App Router / Server Components / Server Actions |

## Agents

| Agent | 用途 |
|-------|------|
| `nextjs-reviewer` | review Next.js App Router patterns, React Server Component boundaries, data fetching strategies, middleware design, caching, and ISR/SSR configuration without modifying any files |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/nextjs-expert/tests/*.test.mjs
```
