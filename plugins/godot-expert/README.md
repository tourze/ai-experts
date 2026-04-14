# godot-expert

Godot 游戏引擎专家插件，覆盖 GDScript 模式、场景状态切换、资源建模与常见运行时陷阱。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/dependency-check.mjs`。
- `skills/godot-gdscript-patterns/`：主技能说明与进阶参考资料。
- `tests/`：manifest、dispatch、依赖检查与 skill 文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `godot-gdscript-patterns` | Godot 4 GDScript 场景组织、状态机、资源建模、对象池与组件化模式 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/godot-expert
```

如果当前工作目录是 Godot 项目，本插件会在 `SessionStart` 时检查 `godot4 | godot` 与 `gdformat`，仅提示缺失，不阻塞使用。

## 验证

```bash
jq empty plugins/godot-expert/.claude-plugin/plugin.json
jq empty plugins/godot-expert/hooks/hooks.json
node --check plugins/godot-expert/hooks/dispatch.mjs
node --check plugins/godot-expert/hooks/session-start/dependency-check.mjs
node --test plugins/godot-expert/tests/*.test.mjs
```
