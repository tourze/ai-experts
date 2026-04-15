# laravel-expert

面向 Laravel 10+ 项目的实现与审计插件，覆盖落地开发、架构边界、安全基线、TDD 和发布前验证。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单、依赖声明、skills 与 hooks 入口。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：5 个 Laravel 顶层技能，以及 `laravel-specialist/references/` 下的专题参考。
- `tests/`：manifest、dispatch 与文档结构测试。

## Skills

| Skill | 用途 |
|-------|------|
| `laravel-specialist` | Laravel 10+ 模型、迁移、请求、资源、队列与 Livewire 实现入口 |
| `laravel-patterns` | 控制器/动作/服务分层、路由绑定、事务、缓存与 API 结构 |
| `laravel-security` | 认证授权、输入验证、文件上传、速率限制、签名链接与安全头 |
| `laravel-tdd` | Pest/PHPUnit 测试驱动开发、HTTP/队列/Sanctum 测试模式 |
| `laravel-verification` | 格式化、静态分析、测试、迁移与发布前验证流水线 |

## 验证命令

在仓库根目录执行：

```bash
claude plugin validate plugins/laravel-expert
jq empty plugins/laravel-expert/.claude-plugin/plugin.json
jq empty plugins/laravel-expert/hooks/hooks.json
node --check plugins/laravel-expert/hooks/dispatch.mjs
node --test plugins/laravel-expert/tests/*.test.mjs
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/laravel-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install laravel-expert@ai-experts
claude plugin install laravel-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall laravel-expert
claude plugin uninstall laravel-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
