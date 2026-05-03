# game-dev-expert

游戏开发专家能力，覆盖 Godot 引擎、GDScript 模式与游戏架构。

## 结构

- `skills/`：游戏开发技能。
- `tests/`：回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `godot-gdscript-patterns` | Godot 4 / GDScript 项目、scene tree、signal 与状态机 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/game-dev-expert/tests/*.test.mjs
```
