# symfony-expert

Symfony 框架专家插件，覆盖 Doctrine ORM、Twig 模板、Messenger 异步消息、Voters 授权和 UX 前端栈。

## Skills

| Skill | 用途 |
|-------|------|
| `symfony-bundle-architecture` | Bundle 目录结构、DI Extension、CompilerPass、依赖声明 |
| `doctrine-entity-patterns` | Entity 映射、关联、Repository、Migration、生命周期 |
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

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install symfony-expert@ai-experts
claude plugin install symfony-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall symfony-expert
claude plugin uninstall symfony-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 校验

```bash
jq empty plugins/symfony-expert/.claude-plugin/plugin.json
jq empty plugins/symfony-expert/hooks/hooks.json
find plugins/symfony-expert/hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/symfony-expert/tests/*.test.mjs
```
