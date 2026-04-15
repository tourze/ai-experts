# miniprogram-expert

面向微信小程序开发、调试、预览和发布流程的插件，覆盖 1 个技能、4 个 PostToolUse hook 和 2 组回归测试。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json`、`dispatch.mjs` 和 WXML/WXSS/Taro/编码检查 hook。
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
| PostToolUse Edit\|Write | `encoding-guard` | 文件编码检查 |

## 验证命令

在插件目录执行：

```bash
claude plugin validate .
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
find hooks -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/miniprogram-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install miniprogram-expert@ai-experts
claude plugin install miniprogram-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall miniprogram-expert
claude plugin uninstall miniprogram-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
