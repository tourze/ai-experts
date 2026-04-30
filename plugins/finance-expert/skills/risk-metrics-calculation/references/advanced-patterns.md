# 风险指标：高级输入模式

本文件是 risk-metrics-calculation `SKILL.md` 的拆分内容，包含 `scripts/risk_metrics_calculator.mjs` 的投资组合与滚动风险输入格式。

## 模式 2：投资组合波动率与分散化比率

```json
{
  "portfolio": {
    "returns": {
      "equity": [0.012, -0.008, 0.004, -0.021, 0.015],
      "bond": [0.002, 0.001, -0.001, 0.003, 0.002],
      "gold": [0.004, 0.006, -0.002, 0.007, -0.001]
    },
    "weights": {
      "equity": 0.6,
      "bond": 0.25,
      "gold": 0.15
    },
    "annualization_factor": 252,
    "risk_free_rate": 0.02,
    "confidence_level": 0.95
  }
}
```

```bash
node scripts/risk_metrics_calculator.mjs input.json --section portfolio --format json
```

## 模式 3：滚动风险监控

```json
{
  "rolling": {
    "returns": [0.012, -0.008, 0.004, -0.021, 0.015, 0.006, -0.003],
    "window": 5,
    "annualization_factor": 252,
    "confidence_level": 0.95
  }
}
```

```bash
node scripts/risk_metrics_calculator.mjs input.json --section rolling --format json
```

## 聚合输入

同一个文件可以同时放入 `single_asset`、`portfolio` 与 `rolling`，并包在 `risk_metrics` 下：

```json
{
  "risk_metrics": {
    "single_asset": { "returns": [0.012, -0.008, 0.004] },
    "portfolio": {
      "returns": {
        "equity": [0.01, -0.02],
        "bond": [0.001, 0.002]
      },
      "weights": { "equity": 0.7, "bond": 0.3 }
    },
    "rolling": {
      "returns": [0.012, -0.008, 0.004, -0.021, 0.015],
      "window": 3
    }
  }
}
```

默认 `--section all` 会输出所有存在的 section；指定 `--section portfolio` 时只要求 portfolio 输入存在。
