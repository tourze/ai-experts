# 商业模式报告契约

## 三个分支

| 分支 | 适用输入 | 必备产物 |
|------|----------|----------|
| `idea_to_model` | 新想法、概念、变现方向 | `3-5` 个选项，至少包含低摩擦、高毛利、高壁垒路径；每个选项给 payer、pricing unit、公式、关键假设、`30/60/90` 天验证动作 |
| `model_diagnosis` | 现有产品、网站、公司 | 当前商业模式图、收入线、直接竞品、跨行业 analog、benchmark、AI 机会、升级建议 |
| `company_case_study` | 成熟公司或上市公司研究 | 多收入线拆解、利润池、强弱项、可迁移模式、环境依赖、学习摘要 |

## 证据等级

| 等级 | 来源 | 用法 |
|------|------|------|
| `S` | 审计财报、交易所披露、正式分部报告 | 可支撑摘要级事实 |
| `A` | 官网、IR、价格页、产品文档、服务条款、官方博客 | 可支撑当前模型与功能判断 |
| `B` | 软件目录、应用商店、GitHub、技术栈工具、招聘信息 | 可支撑可观测信号 |
| `C` | SEO、广告库、社区、社媒、用户评论 | 只作弱信号和待验证假设 |
| `D` | 可比公司推断、访谈、分析师假设 | 只作区间估算和情景判断 |

置信度口径：

```text
85-100: 可进入摘要
70-84: 可作为较强判断，但要写假设
50-69: 仅作区间估算
30-49: 放入附录或假设
<30: 不作为结论
```

## JSON 字段

所有分支都包含：

```json
{
  "analysis_mode": "idea_to_model | model_diagnosis | company_case_study",
  "entity": {},
  "market_environment": {},
  "evidence_items": [],
  "risk_flags": [],
  "unknowns": [],
  "next_validation": [],
  "ai_fit": {}
}
```

分支字段：

- `idea_to_model`：`idea_options`、`scenario_forecast`、`validation_plan`
- `model_diagnosis`：`current_business_models`、`financial_estimates`、`direct_competitors`、`cross_industry_analogs`、`benchmark`、`upgrade_recommendations`
- `company_case_study`：`current_business_models`、`profit_pools`、`strengths`、`weaknesses`、`transferable_patterns`、`environment_dependencies`

## HTML 模块顺序

```text
meta -> executive_summary -> market_environment_fit -> evidence_map
-> current_model/idea_options -> financial_estimate/scenario_forecast
-> direct_competitors -> cross_industry_analogs -> benchmark
-> ai_fit -> upgrade/learning_takeaways -> risk -> appendix
```

## 质量门

- 诊断和案例研究需要直接竞品；目标是 `10` 个，证据不足时说明缺口。
- 涉及战略迁移时需要跨行业 analog；目标是 `10` 个，证据不足时说明缺口。
- 每条收入线必须有公式、变量、区间和置信度。
- 灰色或违法模式只能放在风险识别中，不能作为建议。
- 摘要不得包含低置信度且无来源支持的强结论。
