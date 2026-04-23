# 财务建模：高级模式与反模式

本文件是 creating-financial-models SKILL.md 的拆分内容，包含敏感性分析、场景分析的完整代码模式与反模式。

## 代码模式

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

## 反模式

### FAIL: 场景分析不回滚

```python
for scenario, params in scenarios.items():
    for var, val in params.items():
        setattr(model, var, val)
    results[scenario] = model.value()
# base -> bull -> bear：bear 基于 bull 叠加，不是 base！
```

### PASS: reset_func 显式回滚

```python
base_state = {"growth": model.growth, "margin": model.margin}
def reset():
    for k, v in base_state.items(): setattr(model, k, v)

for scenario, params in scenarios.items():
    reset()  # 每轮先回基准
    for var, val in params.items(): setattr(model, var, val)
    results[scenario] = model.value()
```
