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

## Agents

| Agent | 用途 |
|-------|------|
| `symfony-reviewer` | review Symfony dependency injection, Doctrine mapping, Messenger patterns, Voter authorization, bundle architecture, and service design without modifying any files |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-doctrine-entity` | Doctrine Entity 映射校验 |
| PostToolUse Edit\|Write | `syntax-twig` | Twig 模板语法校验（lint:twig / twigcs） |
| PreToolUse Edit\|Write | `protected-paths` | symfony.lock/var/cache/migrations 保护 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 校验

```bash
find plugins/symfony-expert/hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/symfony-expert/tests/*.test.mjs
```
