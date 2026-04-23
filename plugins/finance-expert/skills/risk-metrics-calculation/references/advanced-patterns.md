# 风险指标：高级代码模式

本文件是 risk-metrics-calculation SKILL.md 的拆分内容，包含投资组合波动率与滚动风险监控的完整代码模式。

## 模式 2：投资组合波动率与分散化比率

```python
import numpy as np
import pandas as pd

returns = pd.DataFrame(
    {
        "equity": [0.012, -0.008, 0.004, -0.021, 0.015],
        "bond": [0.002, 0.001, -0.001, 0.003, 0.002],
        "gold": [0.004, 0.006, -0.002, 0.007, -0.001],
    }
)
weights = pd.Series({"equity": 0.6, "bond": 0.25, "gold": 0.15})
ann_factor = 252

cov_matrix = returns.cov() * ann_factor
portfolio_vol = float(np.sqrt(weights @ cov_matrix @ weights))
asset_vols = returns.std(ddof=1) * np.sqrt(ann_factor)
diversification_ratio = float((weights * asset_vols).sum() / portfolio_vol) if portfolio_vol > 0 else 1.0

print(
    {
        "portfolio_volatility": portfolio_vol,
        "diversification_ratio": diversification_ratio,
        "correlation_matrix": returns.corr().round(4).to_dict(),
    }
)
```

## 模式 3：滚动风险监控

```python
import numpy as np
import pandas as pd

returns = pd.Series(np.linspace(-0.02, 0.02, 90))
window = 21

rolling_vol = returns.rolling(window).std(ddof=1) * np.sqrt(252)
rolling_var_95 = returns.rolling(window).apply(lambda x: -np.percentile(x, 5), raw=True)

print(
    pd.DataFrame(
        {
            "rolling_volatility": rolling_vol,
            "rolling_var_95": rolling_var_95,
        }
    ).tail()
)
```
