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

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install webman-expert@ai-experts
claude plugin install webman-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall webman-expert
claude plugin uninstall webman-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 说明

- 插件 manifest 已显式声明 `skills` 与 `hooks` 路径，不再使用非标准 `dependencies` 字段。
