# legal-expert

法务合规专家插件，覆盖法律风险评估、劳动合同模板和 GDPR 数据合规。

## Skills

| Skill | 用途 |
|-------|------|
| `legal-risk-assessment` | 法律风险严重度×可能性评估与升级 |
| `employment-contract-templates` | 劳动合同 / Offer / HR 政策模板 |
| `gdpr-data-handling` | GDPR 合规数据处理（同意管理 / 数据主体权利） |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/legal-expert/tests/*.test.mjs
find plugins/legal-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
rg -n "TO""DO|FIX""ME|TB""D|When to Use This"" Skill|## Core"" Concepts|## Implementation"" Patterns|## Best"" Practices|### Do""'""s|### Don""'""ts" plugins/legal-expert
```
