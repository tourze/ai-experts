# godot-expert

Godot 游戏引擎专家插件，覆盖 GDScript 模式、场景状态切换、资源建模与常见运行时陷阱。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/godot-gdscript-patterns/`：主技能说明与进阶参考资料。
- `tests/`：manifest、dispatch 与 skill 文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `godot-gdscript-patterns` | Godot 4 GDScript 场景组织、状态机、资源建模、对象池与组件化模式 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/godot-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install godot-expert@ai-experts
claude plugin install godot-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall godot-expert
claude plugin uninstall godot-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
jq empty plugins/godot-expert/.claude-plugin/plugin.json
jq empty plugins/godot-expert/hooks/hooks.json
node --check plugins/godot-expert/hooks/dispatch.mjs
node --test plugins/godot-expert/tests/*.test.mjs
```
