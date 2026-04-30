# finance-expert

财务分析专家能力，覆盖财报比率、DCF 估值、预算差异分析、滚动预测，以及更深入的 DCF/敏感性建模模式。

## 目录

- `skills/financial-analyst/`：财报比率、DCF、预算偏差与滚动预测分析工作流
- `skills/creating-financial-models/`：DCF 与敏感性建模工作流，依赖 `numpy`/`pandas`
- `skills/kelly-sizing/`：Kelly Criterion 仓位、预算和资源分配 sizing
- `skills/risk-metrics-calculation/`：VaR、CVaR、Sharpe、Sortino 与回撤等风险指标计算

## Skills

| Skill | 用途 |
|-------|------|
| `creating-financial-models` | DCF 估值、敏感性分析、情景分析与盈亏平衡建模 |
| `financial-analyst` | 财报比率、DCF、预算偏差与滚动预测分析 |
| `kelly-sizing` | Kelly Criterion / 凯利公式下的投注、投资和资源池分配 sizing |
| `risk-metrics-calculation` | VaR、CVaR、Sharpe、Sortino 与回撤等风险指标计算 |

## 运行时与依赖

- `financial-analyst`：需要 Node.js
- `creating-financial-models`：需要 `numpy`、`pandas`
- `kelly-sizing`：需要 Node.js
- `risk-metrics-calculation`：需要 Node.js

安装第三方依赖：

```bash
pip install numpy pandas
```

## Agents

| Agent | 用途 |
|-------|------|
| `financial-modeler` | 财务建模 / DCF 估值 / 敏感性分析 / SaaS 单位经济 / 风险指标，可写盘 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
node --test plugins/finance-expert/tests/*.test.mjs
python3 -m unittest discover -s plugins/finance-expert/tests -p 'test_*.py'
python3 -m py_compile $(find plugins/finance-expert -name '*.py' -print)
```

具体操作方式只在对应 `SKILL.md` / `references/` 中披露。
