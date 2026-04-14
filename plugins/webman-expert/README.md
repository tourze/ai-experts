# webman-expert

Webman 框架专家插件，覆盖 DDD 架构、依赖注入、领域模型、命名规范和代码风格最佳实践。

## Skills

| Skill | 用途 |
|-------|------|
| `webman-best-practices` | Webman 的 DDD 分层、依赖边界、命名规范、领域建模与 PER 风格约束 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| `SessionStart` | `dependency-check` | 提示推荐安装 `php-expert`，补齐 PHP 语法检查和静态分析协作能力 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/webman-expert
```

## 说明

- 插件 manifest 已显式声明 `skills` 与 `hooks` 路径，不再使用非标准 `dependencies` 字段。
- `php-expert` 不是硬依赖；未安装时只会在 `SessionStart` 给出提示，不会阻止 `webman-expert` 工作。
