# symfony-expert

Symfony 框架专家插件，覆盖 Doctrine ORM、Twig 模板、Messenger 异步消息、Voters 授权和 UX 前端栈。

## Skills

| Skill | 用途 |
|-------|------|
| `symfony-ux` | Symfony UX 前端栈决策树（Stimulus/Turbo/TwigComponent/LiveComponent） |
| `symfony-messenger` | Messenger 异步工作流（幂等/重试/运维） |
| `symfony-voters` | 授权与验证边界（Voter 模式） |
| `doctrine-batch-processing` | Doctrine ORM 批处理与 schema 迁移 |
| `twig-components` | TwigComponent / LiveComponent 组件开发 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-doctrine-entity` | Doctrine Entity 映射校验 |
| PostToolUse Edit\|Write | `syntax-twig` | Twig 模板语法校验（lint:twig / twigcs） |
| PreToolUse Edit\|Write | `protected-paths` | symfony.lock/var/cache/migrations 保护 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/symfony-expert
```

## 校验

```bash
jq empty plugins/symfony-expert/.claude-plugin/plugin.json
jq empty plugins/symfony-expert/hooks/hooks.json
find plugins/symfony-expert/hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/symfony-expert/tests/*.test.mjs
```
