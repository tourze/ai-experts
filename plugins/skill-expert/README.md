# skill-expert

Skill 工程专家插件，覆盖 skill 发现、创建、质量评审和批量治理。插件内 skill 主要从 `/Users/air/work/ai-infra/skills` 复制，并保留所需的脚本、参考资料和辅助资源。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json`、`dispatch.mjs`、`session-start/` 与 `stop/`。
- `SessionStart`：注入 Skill 路由声明要求，并执行插件自检。
- `Stop`：若最终回复缺少“下一步推荐”区块，则阻断结束并要求补齐。
- `skills/`：4 个 skill 工程相关技能及其配套 `scripts/`、`references/`、`agents/`、`assets/`。
- `tests/`：覆盖 manifest、dispatch、hook 自检、脚本语法与 skill 文档交叉引用。

## Skills

| Skill | 用途 |
| --- | --- |
| `find-skills` | 发现可安装的外部 skill，并给出筛选与安装建议 |
| `skill-creator` | 创建或迭代 skill，并组织评测与对比流程 |
| `skill-judge` | 从规范、知识增量和结构设计角度审查 skill 质量 |
| `skills-prune-and-sync-readme` | 审计、清理 skill，并同步 `README.md` 的 skill 列表 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/skill-expert
```

## 验证

```bash
jq empty plugins/skill-expert/.claude-plugin/plugin.json
jq empty plugins/skill-expert/hooks/hooks.json
node --check plugins/skill-expert/hooks/dispatch.mjs
node --check plugins/skill-expert/hooks/session-start/plugin-sanity.mjs
python3 -m py_compile $(find plugins/skill-expert/skills -path '*/scripts/*.py' -o -path '*/eval-viewer/*.py' | sort)
node --test plugins/skill-expert/tests/*.test.mjs
```
