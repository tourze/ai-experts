# nestjs-expert

NestJS 框架专家插件，覆盖模块/控制器/服务/DTO/Guard/拦截器配置。

## 结构

- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/nestjs-layering-patterns/`：主技能说明与 NestJS 参考资料。
- `tests/`：manifest、dispatch 与依赖检查的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `nestjs-layering-patterns` | NestJS 模块分层：module/controller/service + DTO/ValidationPipe + DI |

## Agents

| Agent | 用途 |
|-------|------|
| `nestjs-reviewer` | review NestJS module architecture, dependency injection design, DTO validation, guard/interceptor patterns, and TypeORM/Prisma usage without modifying any files |

## 安装

```bash
claude --plugin-dir /path/to/plugins/nestjs-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install nestjs-expert@ai-experts
claude plugin install nestjs-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall nestjs-expert
claude plugin uninstall nestjs-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
jq empty plugins/nestjs-expert/hooks/hooks.json
node --check plugins/nestjs-expert/hooks/dispatch.mjs
node --test plugins/nestjs-expert/tests/*.test.mjs
```
