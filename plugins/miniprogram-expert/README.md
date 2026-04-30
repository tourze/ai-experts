# miniprogram-expert

面向微信小程序开发、调试、预览和发布流程的专家能力，覆盖 1 个技能、3 个 PostToolUse hook 和 2 组回归测试。

## 目录结构

- `hooks/`：4 个 PostToolUse Edit\|Write 守卫（WXML / WXSS / Taro DOM 语法检查）。
- `skills/`：`miniprogram-development` 技能与本地参考资料。
- `tests/`：hook 行为与回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `miniprogram-development` | 微信小程序构建、调试、预览、测试、发布 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-wxml` | WXML 模板语法检查 |
| PostToolUse Edit\|Write | `syntax-wxss` | WXSS 样式语法检查 |
| PostToolUse Edit\|Write | `syntax-taro-dom` | Taro DOM 语法检查 |

如需通用 BOM / UTF-8 编码检查，请叠加安装 [coding-expert](../coding-expert/README.md)。

## 验证命令

在当前目录执行：

```bash
find hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

