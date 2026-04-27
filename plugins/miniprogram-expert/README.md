# miniprogram-expert

面向微信小程序开发、调试、预览和发布流程的插件，覆盖 1 个技能、3 个 PostToolUse hook 和 2 组回归测试。

## 目录结构

- `hooks/`：`hooks.json`、`dispatch.mjs` 和 WXML/WXSS/Taro 语法检查 hook。
- `skills/`：`miniprogram-development` 技能与本地参考资料。
- `tests/`：`dispatch` 容错回归测试与 hook 行为测试。

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

在插件目录执行：

```bash
claude plugin validate .
jq empty hooks/hooks.json
find hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

