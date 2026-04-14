# meeting-expert

会议管理专家插件，覆盖正式会议纪要、轻量笔记转行动项，以及沟通行为复盘。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/plugin-sanity.mjs`，负责插件自检。
- `skills/`：会议纪要、会议笔记整理、沟通洞察 3 个技能目录。
- `tests/`：manifest、dispatch、hook、自检与 `SKILL.md` 结构回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `meeting-insights-analyzer` | 会议录音/转写的沟通行为分析与反馈 |
| `meeting-minutes` | 正式会议纪要生成（元信息、决策、行动项、风险） |
| `meeting-notes-and-actions` | 粗糙会议笔记转摘要、决策、风险与行动项 |

## Hooks

- `SessionStart`：执行插件自检，验证 `plugin.json`、`hooks/hooks.json`、`hooks/dispatch.mjs`、`SKILL.md` 结构与交叉引用。
- 当前插件无额外运行时依赖；若未来在 `plugin.json.dependencies.optional` 中声明可选插件，自检脚本会同步校验依赖目录是否存在。

## 安装

```bash
claude --plugin-dir /path/to/plugins/meeting-expert
```

## 验证

```bash
python3 -m json.tool plugins/meeting-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/meeting-expert/hooks/hooks.json >/dev/null
find plugins/meeting-expert -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/meeting-expert/tests/*.test.mjs
audit_pattern='TO''DO|FIX''ME|HA''CK|X''XX|Purpose / Over''view|When to U''se|Instruct''ions'
rg -n "$audit_pattern" plugins/meeting-expert --glob '!README.md' --glob '!tests/*'
```
