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

## 检查清单

- 输入 JSON 是否命中正确工具字段，而不是把别的工具数据传进来。
- 比率分析前是否确认 `income_statement`、`balance_sheet`、`cash_flow`、`market_data` 完整。
- DCF 估值前是否确认 `historical.revenue` 非空，且 `assumptions` 中增长率与利润率假设合理。
- 预算差异分析前是否确认 `line_items` 中包含 `type`、`actual`、`budget`。
- 滚动预测前是否确认 `historical_periods`、`scenarios`、`cash_flow_inputs` 具备业务含义。
- 输出为 0 或空列表时，先检查是否把聚合样例的根对象直接传给旧版脚本或错误字段。
- 需要对结果做长期复用时，确认模型是否满足长期复用要求。

## 反模式

### FAIL: Excel 字段名硬塞

```json
{
  "Net Revenue": 1000,
  "Operating Expense": 800
}
```
```bash
node scripts/ratio_calculator.mjs ./input.json
# Error: missing required fields "income_statement.revenue", ...
# 脚本期望按 section 分组的 snake_case 标准命名
```

### PASS: 先整理 JSON

```json
{
  "income_statement": {
    "revenue": 1000,
    "cost_of_goods_sold": 500,
    "operating_income": 200,
    "net_income": 120,
    ...
  },
  "balance_sheet": {
    "total_equity": 600,
    "total_assets": 1200,
    ...
  }
}
```

### FAIL: 0 输出当结论

```bash
node scripts/ratio_calculator.mjs input.json
# ROE: 0.0
# 业务方："ROE 等于 0？这公司有问题！"
→ 实际：`balance_sheet.total_equity` 字段存在但值为 0
→ 脚本可计算输入结构，但分母无业务含义
```

### PASS: 先核对输出合理性

```
ROE = 0 → 先看输入 equity 是否 > 0
缺失必填字段 → 脚本直接报错，先修 JSON 路径
所有比率都 0 → 字段存在但关键值可能为 0
参考 assets/ratio_analysis_sample.json 核对字段路径
```
