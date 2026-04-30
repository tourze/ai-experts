# finance-expert

财务分析专家插件，覆盖财报比率、DCF 估值、预算差异分析、滚动预测，以及更深入的 DCF/敏感性建模模式。

## 目录

- `skills/financial-analyst/`：4 个可直接运行的 CLI 脚本与样例数据
- `skills/creating-financial-models/`：依赖 `numpy`/`pandas` 的 DCF 与敏感性建模脚本
- `skills/kelly-sizing/`：Kelly Criterion 仓位、预算和资源分配方法
- `skills/risk-metrics-calculation/`：风险指标方法论与经校验的代码模式

## Skills

| Skill | 用途 |
|-------|------|
| `creating-financial-models` | DCF 估值、敏感性分析、情景分析与盈亏平衡建模 |
| `financial-analyst` | 财报比率、DCF、预算偏差与滚动预测分析 |
| `kelly-sizing` | Kelly Criterion / 凯利公式下的投注、投资和资源池分配 sizing |
| `risk-metrics-calculation` | VaR、CVaR、Sharpe、Sortino 与回撤等风险指标计算 |

## Python 依赖

- `financial-analyst`：CLI 使用 Node.js `.mjs`
- `creating-financial-models`：需要 `numpy`、`pandas`
- `kelly-sizing`：方法型 skill，无额外脚本依赖
- `risk-metrics-calculation`：示例代码使用 `numpy`、`pandas`

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
node --check plugins/finance-expert/skills/financial-analyst/scripts/ratio_calculator.mjs
node --check plugins/finance-expert/skills/financial-analyst/scripts/dcf_valuation.mjs
node --check plugins/finance-expert/skills/financial-analyst/scripts/budget_variance_analyzer.mjs
node --check plugins/finance-expert/skills/financial-analyst/scripts/forecast_builder.mjs
node --test plugins/finance-expert/tests/*.test.mjs
python3 -m unittest discover -s plugins/finance-expert/tests -p 'test_*.py'
python3 -m py_compile $(find plugins/finance-expert -name '*.py' -print)
```
