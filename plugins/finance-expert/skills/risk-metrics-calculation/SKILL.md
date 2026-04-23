---
name: risk-metrics-calculation
description: 当需要计算投资组合风险指标（VaR、CVaR、Sharpe、Sortino、回撤）时使用。英文触发词包括 portfolio risk、risk monitoring。
---

# 风险指标技能

## 适用场景

- 需要衡量收益波动、尾部风险、最大回撤和风险调整后收益。
- 需要构建投组级风险监控，而不是公司经营分析或企业估值。
- 需要把日收益率序列转换成 Sharpe、Sortino、VaR、CVaR、Max Drawdown 等指标。
- 若问题是公司经营质量、预算偏差或滚动预测，转到 [financial-analyst](../financial-analyst/SKILL.md)。
- 若问题是企业估值模型与假设敏感性，转到 [creating-financial-models](../creating-financial-models/SKILL.md)。

## 核心约束

- 示例代码依赖 `numpy` 与 `pandas`，不依赖 `scipy`。
- 输入收益率必须使用小数制，例如 `0.01` 代表 1%，不能混用百分数。
- 年化因子要与数据频率一致；以下示例默认日频、252 个交易日。
- 历史 VaR/CVaR 只描述样本分布，不等于极端行情的完整上界。
- 没有仓库内置 CLI；这是方法技能，代码模式需要按任务落地到 Notebook、脚本或服务。

## 代码模式

### 模式 1：单资产核心风险指标

```python
import numpy as np
import pandas as pd

returns = pd.Series([0.012, -0.008, 0.004, -0.021, 0.015, 0.006, -0.003])
ann_factor = 252
rf_rate = 0.02

volatility = returns.std(ddof=1) * np.sqrt(ann_factor)
downside = returns[returns < 0]
downside_dev = downside.std(ddof=1) * np.sqrt(ann_factor) if len(downside) > 1 else 0.0
var_95 = -np.percentile(returns, 5)
cvar_95 = -returns[returns <= -var_95].mean()

cumulative = (1 + returns).cumprod()
running_max = cumulative.cummax()
drawdown = (cumulative - running_max) / running_max

excess_return = returns.mean() * ann_factor - rf_rate
sharpe = excess_return / volatility if volatility > 0 else 0.0
sortino = excess_return / downside_dev if downside_dev > 0 else 0.0

summary = {
    "annual_volatility": float(volatility),
    "var_95": float(var_95),
    "cvar_95": float(cvar_95),
    "max_drawdown": float(drawdown.min()),
    "sharpe_ratio": float(sharpe),
    "sortino_ratio": float(sortino),
}
print(summary)
```

投资组合波动率与滚动风险监控的完整代码模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 检查清单

- 收益率是否统一为同一频率、同一计量方式。
- 风险自由利率是否与年化方式一致。
- 组合权重是否和为 1，且索引与收益列完全对齐。
- 计算 CVaR 时是否基于同一个 VaR 阈值样本集。
- 做滚动窗口时是否确认窗口长度足以覆盖一个完整风险观察周期。
- 需要把风险结论放回企业经营上下文时，是否回到 [financial-analyst](../financial-analyst/SKILL.md) 或 [creating-financial-models](../creating-financial-models/SKILL.md) 联动解释。

## 反模式

### FAIL: 百分数当小数

```python
returns = pd.Series([1.2, -0.8, 2.1])  # 百分数
volatility = returns.std() * np.sqrt(252)
# 结果 1750% → 明显错
```

### PASS: 统一小数

```python
returns = pd.Series([0.012, -0.008, 0.021])
# 或 raw_pct / 100
```

### FAIL: 只报 VaR

```
"VaR 95 = 2.1%"
→ 缺 CVaR / 回撤 / 波动率 → 风险画像残缺
```

### PASS: 六指标齐全

```
volatility / var / cvar / max_drawdown / sharpe / sortino
```

### FAIL: 短窗口精确数

```python
# 仅 5 天数据 → 报 "VaR 99 = 3.2%"（无统计意义）
```

### PASS: 样本不足只给方向

```python
if len(returns) < 60:
    print("样本少，仅给方向性判断")
```
