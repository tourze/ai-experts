# webman-expert

Webman 框架专家插件，覆盖 DDD 架构、依赖注入、领域模型、命名规范和代码风格最佳实践。

## Skills

| Skill | 用途 |
|-------|------|
| `webman-best-practices` | Webman 的 DDD 分层、依赖边界、命名规范、领域建模与 PER 风格约束 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/webman-expert
```

## 说明

- 插件 manifest 已显式声明 `skills` 与 `hooks` 路径，不再使用非标准 `dependencies` 字段。
