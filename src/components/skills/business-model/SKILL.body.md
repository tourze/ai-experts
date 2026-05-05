## 执行流程

1. 选择主分支：`idea_to_model`、`model_diagnosis` 或 `company_case_study`。
2. 阅读 [商业模式报告契约](references/report-contract.md)，按分支确认必备字段。
3. 收集证据并分级：`S/A` 支撑摘要事实，`B/C/D` 只支撑信号、估算或假设。
4. 生成结构化 JSON 作为审计源，再输出人类可读摘要和 HTML 模块规划。

## 代码模式

```json
{
  "analysis_mode": "model_diagnosis",
  "market_environment": {"target_market": "US SMB SaaS", "buyer": "RevOps Lead"},
  "current_business_models": [
    {
      "model_label": "subscription + AI credits",
      "payer": "team admin",
      "pricing_unit": "seat/month + usage",
      "status": "fact",
      "evidence_tier": "A",
      "confidence": 76
    }
  ],
  "financial_estimates": [
    {
      "formula": "revenue = seats * price * retention + credits",
      "low": 5000,
      "base": 18000,
      "high": 45000,
      "confidence": 58
    }
  ]
}
```
