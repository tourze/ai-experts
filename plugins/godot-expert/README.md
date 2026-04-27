# godot-expert

Godot 游戏引擎专家插件，覆盖 GDScript 模式、场景状态切换、资源建模与常见运行时陷阱。

## 结构

- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/godot-gdscript-patterns/`：主技能说明与进阶参考资料。
- `tests/`：manifest、dispatch 与 skill 文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `godot-gdscript-patterns` | Godot 4 GDScript 场景组织、状态机、资源建模、对象池与组件化模式 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
jq empty plugins/godot-expert/hooks/hooks.json
node --check plugins/godot-expert/hooks/dispatch.mjs
node --test plugins/godot-expert/tests/*.test.mjs
```
