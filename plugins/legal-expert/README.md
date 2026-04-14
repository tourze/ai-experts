# legal-expert

法务合规专家插件，覆盖法律风险评估、劳动合同模板和 GDPR 数据合规。

## Skills

| Skill | 用途 |
|-------|------|
| `legal-risk-assessment` | 法律风险严重度×可能性评估与升级 |
| `employment-contract-templates` | 劳动合同 / Offer / HR 政策模板 |
| `gdpr-data-handling` | GDPR 合规数据处理（同意管理 / 数据主体权利） |

## Hooks

- `SessionStart`：执行插件自检，校验 `plugin.json`、`hooks/hooks.json`、`skills/` 的结构，以及 `README.md` 是否存在。
- 设计原则：仅 `report` 不 `block`，发现问题时保持 fail-open，不影响继续使用。

## 安装

```bash
claude --plugin-dir /path/to/plugins/legal-expert
```

## 验证

```bash
node --test plugins/legal-expert/tests/*.test.mjs
find plugins/legal-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
rg -n "TO""DO|FIX""ME|TB""D|When to Use This"" Skill|## Core"" Concepts|## Implementation"" Patterns|## Best"" Practices|### Do""'""s|### Don""'""ts" plugins/legal-expert
```
