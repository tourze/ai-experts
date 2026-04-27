# nestjs-expert

NestJS 框架专家插件，覆盖模块/控制器/服务/DTO/Guard/拦截器配置。

## 结构

- `hooks/`：1 个 PostToolUse Edit\|Write 守卫。
- `skills/nestjs-layering-patterns/`：主技能说明与 NestJS 参考资料。
- `tests/`：依赖检查与最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `nestjs-layering-patterns` | NestJS 模块分层：module/controller/service + DTO/ValidationPipe + DI |

## Agents

| Agent | 用途 |
|-------|------|
| `nestjs-reviewer` | review NestJS module architecture, dependency injection design, DTO validation, guard/interceptor patterns, and TypeORM/Prisma usage without modifying any files |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/nestjs-expert/tests/*.test.mjs
```
