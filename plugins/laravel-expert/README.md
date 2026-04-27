# laravel-expert

面向 Laravel 10+ 项目的实现与审计插件，覆盖落地开发、架构边界、安全基线、TDD 和发布前验证。

## 目录结构

- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：5 个 Laravel 顶层技能，以及 `laravel-layering-patterns/references/` 下的专题参考。
- `tests/`：manifest、dispatch 与文档结构测试。

## Skills

| Skill | 用途 |
|-------|------|
| `laravel-layering-patterns` | Laravel 10+ Model/Migration/FormRequest/Resource/Controller/Job/Livewire 实现 |
| `laravel-patterns` | 控制器/动作/服务分层、路由绑定、事务、缓存与 API 结构 |
| `laravel-security` | 认证授权、输入验证、文件上传、速率限制、签名链接与安全头 |
| `laravel-tdd` | Pest/PHPUnit 测试驱动开发、HTTP/队列/Sanctum 测试模式 |
| `laravel-verification` | 格式化、静态分析、测试、迁移与发布前验证流水线 |

## Agents

| Agent | 用途 |
|-------|------|
| `laravel-reviewer` | review Laravel application architecture, Eloquent usage, FormRequest validation, Policy/Gate authorization, migration safety, and queue design without modifying any files |

## 验证命令

在仓库根目录执行：

```bash
claude plugin validate plugins/laravel-expert
jq empty plugins/laravel-expert/hooks/hooks.json
node --check plugins/laravel-expert/hooks/dispatch.mjs
node --test plugins/laravel-expert/tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

