# obsidian-expert

Obsidian 专家插件，覆盖 Bases 结构设计、`.base` 文件修复，以及 Obsidian CLI 的笔记 / Vault / 开发命令工作流。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/obsidian-bases/`：Bases 语法、视图、过滤、公式与嵌入模式。
- `skills/obsidian-cli/`：CLI 读写笔记、daily/tasks/properties/tags/backlinks 与开发调试命令。
- `tests/`：`dispatch` 的最小回归测试。

## 技能

| Skill | 用途 |
|-------|------|
| `obsidian-bases` | `.base` 文件、视图、过滤、公式、摘要与嵌入模式 |
| `obsidian-cli` | CLI 笔记读写、Vault 操作、daily/tasks/properties/tags/backlinks 与开发命令 |

## 验证命令

在插件目录执行：

```bash
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
find hooks tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/dispatch.test.mjs
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

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install obsidian-expert@ai-experts
claude plugin install obsidian-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall obsidian-expert
claude plugin uninstall obsidian-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
