# 财务建模技能

## 适用场景

- 需要把估值逻辑封装成可复用 Python 模型，而不只是执行一次性 CLI 分析。
- 需要处理 DCF 现金流投影、WACC、终值、双变量敏感性、情景分析或盈亏平衡搜索。
- 需要把财务假设拉成参数矩阵，输出 DataFrame、估值表或摘要文本。
- 若只是快速做经营分析、预算偏差和基础估值，先用 [financial-analyst](../financial-analyst/SKILL.md)。
- 若需求转向投资组合风险与市场回撤指标，转到 [risk-metrics-calculation](../risk-metrics-calculation/SKILL.md)。

## 核心约束

- 本技能当前只覆盖仓库内真实存在的能力：`dcf_model.py` 与 `sensitivity_analysis.py`。
- 依赖 `numpy` 与 `pandas`；运行前先安装：`pip install numpy pandas`。
- `DCFModel.set_historical_financials()` 要求历史序列长度一致。
- 终值增长法要求 `WACC > terminal_growth`，否则应先修正假设，而不是吞掉异常。
- `scenario_analysis()` 默认按模型属性名回滚状态；若变量名与模型属性不一致，传入 `reset_func`。

## 代码模式

### 模式 1：构建并执行 DCF 模型

```python
from dcf_model import DCFModel

model = DCFModel("Acme Corp")
model.set_historical_financials(
    revenue=[800, 900, 1000],
    ebitda=[160, 189, 220],
    capex=[40, 45, 50],
    nwc=[80, 90, 100],
    years=[2022, 2023, 2024],
)
model.set_assumptions(
    projection_years=5,
    revenue_growth=[0.15, 0.12, 0.10, 0.08, 0.06],
    ebitda_margin=[0.23, 0.24, 0.25, 0.25, 0.25],
    tax_rate=0.25,
    terminal_growth=0.03,
)
model.calculate_wacc(
    risk_free_rate=0.04,
    beta=1.2,
    market_premium=0.07,
    cost_of_debt=0.05,
    debt_to_equity=0.5,
)
model.project_cash_flows()
model.calculate_enterprise_value()
model.calculate_equity_value(net_debt=200, shares_outstanding=50)
print(model.generate_summary())
```

敏感性分析与场景分析的完整代码模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 检查清单

- 运行前是否已安装 `numpy` 与 `pandas`。
- 历史收入、EBITDA、Capex、NWC、年份序列长度是否一致。
- 假设数组长度是否覆盖全部 `projection_years`，或接受自动补齐末值。
- 使用增长法算终值时，是否确认 `WACC > terminal_growth`。
- 做情景分析时，是否确保每轮场景前模型状态会回到基准值。
- 输出结果进入报告前，是否与 [financial-analyst](../financial-analyst/SKILL.md) 的基础分析相互校验。

## 反模式

### FAIL: WACC ≤ terminal_growth

```python
model.set_assumptions(..., terminal_growth=0.05)
model.calculate_wacc(...)  # 得到 WACC = 0.04
model.calculate_enterprise_value()
# 终值公式 = CF / (WACC - g) → 分母为负
# 估值无意义或抛异常
```

### PASS: 先验证再算

```python
if model.wacc <= model.terminal_growth:
    raise ValueError(f"WACC {model.wacc} must > growth {model.terminal_growth}")
# 或切到退出倍数法终值，而不是增长法
```

场景分析不回滚的反模式与修复见 [references/advanced-patterns.md](references/advanced-patterns.md)。