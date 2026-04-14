# nestjs-expert

NestJS 框架专家插件，覆盖模块/控制器/服务/DTO/Guard/拦截器配置。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`、`hooks/hooks.json` 与依赖。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/dependency-check.mjs`。
- `skills/nestjs-expert/`：主技能说明与 NestJS 参考资料。
- `tests/`：dispatch 与依赖检查的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `nestjs-expert` | NestJS 模块、控制器、服务、DTO、Guard、拦截器 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/nestjs-expert
```

建议同时安装 `typescript-expert` 插件；本插件会在 `SessionStart` 时检查该依赖是否可用。

## 验证

```bash
jq empty plugins/nestjs-expert/.claude-plugin/plugin.json
jq empty plugins/nestjs-expert/hooks/hooks.json
node --check plugins/nestjs-expert/hooks/dispatch.mjs
node --check plugins/nestjs-expert/hooks/session-start/dependency-check.mjs
node --test plugins/nestjs-expert/tests/*.test.mjs
```
