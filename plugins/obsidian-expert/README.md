# obsidian-expert

Obsidian 专家插件，覆盖 Bases 结构设计、`.base` 文件修复，以及 Obsidian CLI 的笔记 / Vault / 开发命令工作流。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式注册 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/dependency-check.mjs`。
- `skills/obsidian-bases/`：Bases 语法、视图、过滤、公式与嵌入模式。
- `skills/obsidian-cli/`：CLI 读写笔记、daily/tasks/properties/tags/backlinks 与开发调试命令。
- `tests/`：`dispatch` 的最小回归测试。

## 技能

| Skill | 用途 |
|-------|------|
| `obsidian-bases` | `.base` 文件、视图、过滤、公式、摘要与嵌入模式 |
| `obsidian-cli` | CLI 笔记读写、Vault 操作、daily/tasks/properties/tags/backlinks 与开发命令 |

## Hook

| 事件 | Hook | 作用 |
|------|------|------|
| `SessionStart` | `dependency-check` | 检查 `obsidian` CLI 是否可用，避免插件能力在本地静默失效 |

## 验证命令

在插件目录执行：

```bash
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
find hooks tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/dispatch.test.mjs
node hooks/dispatch.mjs session-start </dev/null
printf '{not-json' | node hooks/dispatch.mjs session-start
```

## 官方参考

- `https://help.obsidian.md/cli`
- `https://help.obsidian.md/bases`
- `https://help.obsidian.md/bases/syntax`
- `https://help.obsidian.md/bases/functions`
- `https://help.obsidian.md/bases/views`

## 安装

```bash
claude --plugin-dir /path/to/plugins/obsidian-expert
```
