## 核心约束

- 先建 `market_environment`，再套画布：目标市场、买方、渠道、监管、支付、交付约束都会改变商业模式。
- 每个关键判断都标注 `fact`、`estimate`、`hypothesis` 或 `recommendation`，并给证据等级。
- 诊断和案例研究必须同时看直接竞品与跨行业 analog；不足时说明证据缺口。
- 收入、GMV、TPV、AUM、用户数和 ARR 不能混用；金额估算要写公式、变量、低/中/高区间和置信度。
- 不要把功能清单、组织架构或愿景口号误写成商业模式。

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

## 检查清单

- [ ] 已选择一个主分支，并说明其他需求如何作为辅助模块处理。
- [ ] 已建立市场环境画像，并说明地区、买方、渠道、监管和交付约束。
- [ ] 已区分 `fact`、`estimate`、`hypothesis`、`recommendation`。
- [ ] 每条收入线都有公式、变量、区间和置信度。
- [ ] 诊断/案例研究已覆盖直接竞品和跨行业 analog；不足时说明原因。
- [ ] 已包含 AI 作为成本驱动、效率杠杆、可收费单元或颠覆风险的判断。

## 反模式

### FAIL: 目标客户“所有人”

```
客户细分：所有需要数据分析的企业、个人和机构
→ 销售不知找谁，产品不知为谁设计
```

### PASS: 显式画像 + 证据

```
客户细分：50-200 人 SaaS 的 RevOps Lead
证据：已访谈 12 家，8 家愿意看付费试点
```

### FAIL: 把 GMV 当收入

```
平台一年处理 GMV $1B → 收入 $1B
→ 忽略 take rate、退款、补贴、支付成本和履约成本
```

### PASS: 写清收入基础

```
GMV: $1B
take rate: 8%-12%
recognized revenue: $80M-$120M
confidence: 62（价格页 + 可比公司推断）
```

### FAIL: 只看直接竞品

```
竞品：同类 SaaS A/B/C
结论：大家都按 seat 收费，所以我们也 seat
→ 漏掉跨行业 usage credits / marketplace take rate / outcome-based pricing
```

### PASS: 加 cross-industry analog

```
直接竞品：10 个同类 SaaS
跨行业 analog：DevTools credits、payment take rate、ad marketplace、managed service
结论：seat 作为入口，usage credits 作为 AI 成本回收层
```
