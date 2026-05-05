## 代码模式

### 模式 1：财务比率分析

```bash
node scripts/ratio_calculator.mjs assets/ratio_analysis_sample.json --format json
node scripts/ratio_calculator.mjs assets/sample_financial_data.json --category profitability
```

### 模式 2：DCF 估值

```bash
node scripts/dcf_valuation.mjs assets/dcf_valuation_sample.json --format json
node scripts/dcf_valuation.mjs assets/sample_financial_data.json --projection-years 7
```

### 模式 3：预算差异分析

```bash
node scripts/budget_variance_analyzer.mjs assets/budget_variance_sample.json --format json
node scripts/budget_variance_analyzer.mjs assets/sample_financial_data.json --threshold-pct 5 --threshold-amt 25000
```

### 模式 4：滚动预测

```bash
node scripts/forecast_builder.mjs assets/forecast_sample.json --format json
node scripts/forecast_builder.mjs assets/sample_financial_data.json --scenarios base,bull,bear
```

### 可复用资料

- `references/financial-ratios-guide.md`：比率公式、解释与基准。
- `references/valuation-methodology.md`：DCF、WACC、终值方法。
- `references/forecasting-best-practices.md`：驱动预测、滚动预测、精度治理。
- `references/industry-adaptations.md`：行业差异化指标。
- `assets/variance_report_template.md`、`assets/dcf_analysis_template.md`、`assets/forecast_report_template.md`：报告模板。
