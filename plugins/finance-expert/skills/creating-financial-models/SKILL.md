---
name: creating-financial-models
description: 用于高级财务建模、DCF 模型、敏感性分析、情景分析与盈亏平衡分析。适合 investment analysis、valuation modeling、scenario planning 等任务。
---

# 财务建模技能

## 适用场景

- 需要把估值逻辑封装成可复用 Python 模型，而不只是执行一次性 CLI 分析。
- 需要处理 DCF 现金流投影、WACC、终值、双变量敏感性、情景分析或盈亏平衡搜索。
- 需要把财务假设拉成参数矩阵，输出 DataFrame、估值表或摘要文本。
- 若只是快速做经营分析、预算偏差和基础估值，先用 [financial-analyst](../financial-analyst/SKILL.md)。
- 若需求转向投资组合风险与市场回撤指标，转到 [risk-metrics-calculation](../risk-metrics-calculation/SKILL.md)。

## 核心约束

- 本技能当前只覆盖仓库内真实存在的能力：`dcf_model.py` 与 `sensitivity_analysis.py`。
- 依赖 `numpy` 与 `pandas`；运行前先安装插件根目录的 `requirements.txt`。
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

### 模式 2：单变量敏感性分析

```python
from sensitivity_analysis import SensitivityAnalyzer

class SimpleModel:
    def __init__(self) -> None:
        self.revenue = 1000.0
        self.margin = 0.20
        self.multiple = 10.0

    def calculate_value(self) -> float:
        return self.revenue * self.margin * self.multiple

model = SimpleModel()
analyzer = SensitivityAnalyzer(model)
results = analyzer.one_way_sensitivity(
    variable_name="Revenue",
    base_value=model.revenue,
    range_pct=0.20,
    steps=5,
    output_func=model.calculate_value,
    model_update_func=lambda x: setattr(model, "revenue", x),
)
print(results[["value", "output", "output_change"]])
```

### 模式 3：场景分析并显式回滚状态

```python
from sensitivity_analysis import SensitivityAnalyzer

class ScenarioModel:
    def __init__(self) -> None:
        self.growth = 0.08
        self.margin = 0.22

    def value(self) -> float:
        return 1000 * (1 + self.growth) * self.margin * 12

model = ScenarioModel()
analyzer = SensitivityAnalyzer(model)
base_state = {"growth": model.growth, "margin": model.margin}

def reset() -> None:
    model.growth = base_state["growth"]
    model.margin = base_state["margin"]

scenarios = {
    "base": {"growth": 0.08, "margin": 0.22},
    "bull": {"growth": 0.12, "margin": 0.25},
    "bear": {"growth": 0.03, "margin": 0.18},
}
updates = {
    "growth": lambda x: setattr(model, "growth", x),
    "margin": lambda x: setattr(model, "margin", x),
}
df = analyzer.scenario_analysis(
    scenarios=scenarios,
    variable_updates=updates,
    output_func=model.value,
    reset_func=reset,
)
print(df[["scenario", "probability", "output"]])
```

## 检查清单

- 运行前是否已安装 `numpy` 与 `pandas`。
- 历史收入、EBITDA、Capex、NWC、年份序列长度是否一致。
- 假设数组长度是否覆盖全部 `projection_years`，或接受自动补齐末值。
- 使用增长法算终值时，是否确认 `WACC > terminal_growth`。
- 做情景分析时，是否确保每轮场景前模型状态会回到基准值。
- 输出结果进入报告前，是否与 [financial-analyst](../financial-analyst/SKILL.md) 的基础分析相互校验。

## 反模式

- 不要宣称本技能已提供 Monte Carlo、LBO 或并购协同建模脚本；仓库当前没有这些实现。
- 不要在输入序列长度不一致时硬跑模型。
- 不要在 `WACC <= terminal_growth` 时继续使用增长法终值。
- 不要让场景分析在共享对象上连续累积状态而不回滚。
