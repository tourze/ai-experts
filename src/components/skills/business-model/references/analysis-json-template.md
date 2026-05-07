# 商业模式 JSON 审计源模板

结构化 JSON 是商业模式分析的审计源。人类可读摘要和 HTML 模块规划应从该结构派生。

```json
{
  "analysis_mode": "model_diagnosis",
  "market_environment": {
    "target_market": "US SMB SaaS",
    "buyer": "RevOps Lead"
  },
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

字段要求：

- `analysis_mode` 必须是 `idea_to_model`、`model_diagnosis` 或 `company_case_study`。
- `status` 标记为 `fact`、`estimate`、`hypothesis` 或 `recommendation`。
- `evidence_tier` 使用 `S/A/B/C/D`，其中 `S/A` 才能支撑摘要事实。
- 金额估算必须包含公式、变量、低/中/高区间和置信度。
