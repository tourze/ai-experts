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

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
python3 -m json.tool plugins/meeting-expert/hooks/hooks.json >/dev/null
find plugins/meeting-expert -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/meeting-expert/tests/*.test.mjs
audit_pattern='TO''DO|FIX''ME|HA''CK|X''XX|Purpose / Over''view|When to U''se|Instruct''ions'
rg -n "$audit_pattern" plugins/meeting-expert --glob '!README.md' --glob '!tests/*'
```
