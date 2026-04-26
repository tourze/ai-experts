# meeting-expert

会议管理专家插件，覆盖正式会议纪要、轻量笔记转行动项，以及沟通行为复盘。

## 结构

- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：会议纪要、会议笔记整理、沟通洞察 3 个技能目录。
- `tests/`：manifest、dispatch、hook、自检与 `SKILL.md` 结构回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `meeting-insights-analyzer` | 会议录音/转写的沟通行为分析与反馈 |
| `meeting-minutes` | 正式会议纪要生成（元信息、决策、行动项、风险） |
| `meeting-notes-and-actions` | 粗糙会议笔记转摘要、决策、风险与行动项 |

## Hooks


## 安装

```bash
claude --plugin-dir /path/to/plugins/meeting-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install meeting-expert@ai-experts
claude plugin install meeting-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall meeting-expert
claude plugin uninstall meeting-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
python3 -m json.tool plugins/meeting-expert/hooks/hooks.json >/dev/null
find plugins/meeting-expert -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/meeting-expert/tests/*.test.mjs
audit_pattern='TO''DO|FIX''ME|HA''CK|X''XX|Purpose / Over''view|When to U''se|Instruct''ions'
rg -n "$audit_pattern" plugins/meeting-expert --glob '!README.md' --glob '!tests/*'
```
