import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, financialAnalystBudgetVarianceAnalyzer, financialAnalystDcfValuation, financialAnalystForecastBuilder, financialAnalystRatioCalculator, financialAnalystRatioInputValidation } from "../../procedures/index";

export const financialAnalystSkill = defineSkill({
  id: "financial-analyst",
  fullName: "财务分析师技能",
  description: "当需要做财报比率分析、DCF 估值、预算偏差或滚动预测时使用。",
  useCases: [
    "需要快速完成财报比率分析、预算偏差归因、滚动预测或基础 DCF 估值。",
    "需要直接运行现成脚本，而不是先搭建 Notebook、Pandas 管道或 Excel 模板。",
    "需要把公司经营分析与估值分析串起来时，先用本技能完成输入清洗与基础结论。",
    "若任务升级为更灵活的估值假设、双变量敏感性或盈亏平衡分析，参考财务建模相关方法。",
    "若问题转向投资组合 VaR、CVaR、Sharpe、回撤等市场风险指标，参考风险管理相关方法。",
  ],
  constraints: [
    "5 个分析入口都通过本 skill 的 Procedure 调用，运行时统一走平台级 `procedures.js`。",
    "每个 Procedure 同时接受两种输入：直接工具专用 JSON，或聚合样例 `assets/sample_financial_data.json` 中对应的子段。",
    "推荐优先使用专用样例文件：\n`assets/ratio_analysis_sample.json`、`assets/dcf_valuation_sample.json`、`assets/budget_variance_sample.json`、`assets/forecast_sample.json`。",
    "本技能不负责 Excel、CSV、数据库抽取；先把数据整理成 JSON 再调用 Procedure。",
    "Procedure 输出面向单次分析；若需要复用模型逻辑或批量场景分析，应先把需求拆成独立模型化任务。",
  ],
  checklist: [
    "输入 JSON 是否命中正确工具字段，而不是把别的工具数据传进来。",
    "比率分析前是否确认 `income_statement`、`balance_sheet`、`cash_flow`、`market_data` 完整。",
    "DCF 估值前是否确认 `historical.revenue` 非空，且 `assumptions` 中增长率与利润率假设合理。",
    "预算差异分析前是否确认 `line_items` 中包含 `type`、`actual`、`budget`。",
    "滚动预测前是否确认 `historical_periods`、`scenarios`、`cash_flow_inputs` 具备业务含义。",
    "输出为 0 或空列表时，先检查是否把聚合样例的根对象直接传给 Procedure 或错误字段。",
    "需要对结果做长期复用时，确认模型是否满足长期复用要求。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Excel 字段名硬塞",
      pass: "先整理 JSON",
    }),
    defineAntiPattern({
      fail: "0 输出当结论",
      pass: "先核对输出合理性",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先判断分析类型：比率分析、DCF 估值、预算差异、滚动预测或输入校验，并选择对应 procedure。",
      "确认输入是工具专用 JSON 或聚合样例的正确子段；Excel、CSV、数据库抽取不在本 skill 内完成。",
      "需要公式、行业口径或估值方法时读取 financial-ratios-guide、valuation-methodology、forecasting-best-practices 或 industry-adaptations。",
      "运行 procedure 后先检查 0、空列表、异常大数和字段错配，再解释结果。",
      "需要报告时使用 variance_report_template、dcf_analysis_template 或 forecast_report_template，区分事实计算、假设和管理层判断。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "分析类型、输入文件/字段、使用的 procedure、样例资产和关键假设。",
      "比率、估值、预算差异或预测结果，以及异常值、口径限制和行业适配说明。",
      "可交付报告、模板选择、结论置信度、后续敏感性分析或长期模型化建议。",
    ],
  }),
  procedures: [
    procedureUse(financialAnalystBudgetVarianceAnalyzer),
    procedureUse(financialAnalystDcfValuation),
    procedureUse(financialAnalystForecastBuilder),
    procedureUse(financialAnalystRatioCalculator),
    procedureUse(financialAnalystRatioInputValidation),
  ],
  references: [
    defineReference({
      id: "creating-financial-models",
      source: new URL("./references/creating-financial-models.md", import.meta.url),
      target: "references/creating-financial-models.md",
      title: "creating-financial-models.md",
      summary: "财务模型的构建原则、结构设计和最佳实践。",
      loadWhen: "需要搭建财务模型或审查现有模型的架构合理性时读取。",
    }),
    defineReference({
      id: "financial-ratios-guide",
      source: new URL("./references/financial-ratios-guide.md", import.meta.url),
      target: "references/financial-ratios-guide.md",
      title: "financial-ratios-guide.md",
      summary: "常用财务比率的计算公式、业务含义与解读方法。",
      loadWhen: "需要计算或解读财报比率分析结果时读取。",
    }),
    defineReference({
      id: "forecasting-best-practices",
      source: new URL("./references/forecasting-best-practices.md", import.meta.url),
      target: "references/forecasting-best-practices.md",
      title: "forecasting-best-practices.md",
      summary: "滚动预测和财务预测的最佳实践，包括假设管理和敏感性分析。",
      loadWhen: "需要制定财务预测或审查预测假设的合理性时读取。",
    }),
    defineReference({
      id: "industry-adaptations",
      source: new URL("./references/industry-adaptations.md", import.meta.url),
      target: "references/industry-adaptations.md",
      title: "industry-adaptations.md",
      summary: "不同行业财务分析的差异化方法与行业特有指标。",
      loadWhen: "需要对特定行业进行财务分析或跨行业对比时读取。",
    }),
    defineReference({
      id: "kelly-sizing",
      source: new URL("./references/kelly-sizing.md", import.meta.url),
      target: "references/kelly-sizing.md",
      title: "kelly-sizing.md",
      summary: "Kelly 准则在投资仓位管理中的应用方法与计算说明。",
      loadWhen: "需要计算最优投资仓位或评估风险敞口时读取。",
    }),
    defineReference({
      id: "risk-metrics-calculation",
      source: new URL("./references/risk-metrics-calculation.md", import.meta.url),
      target: "references/risk-metrics-calculation.md",
      title: "risk-metrics-calculation.md",
      summary: "VaR、CVaR、Sharpe 比率等市场风险指标的计算方法与应用场景。",
      loadWhen: "需要计算投资组合风险指标或评估市场风险暴露时读取。",
    }),
    defineReference({
      id: "saas-metrics",
      source: new URL("./references/saas-metrics.md", import.meta.url),
      target: "references/saas-metrics.md",
      title: "saas-metrics.md",
      summary: "SaaS 业务的财务关键指标（ARR、NRR、CAC、LTV 等）的定义和计算方法。",
      loadWhen: "需要分析 SaaS 公司财务健康度或计算订阅业务核心指标时读取。",
    }),
    defineReference({
      id: "valuation-methodology",
      source: new URL("./references/valuation-methodology.md", import.meta.url),
      target: "references/valuation-methodology.md",
      title: "valuation-methodology.md",
      summary: "DCF、可比公司分析等企业估值方法的详细说明与适用场景。",
      loadWhen: "需要执行 DCF 估值或选择适当的估值方法时读取。",
    }),
  ],
  assets: [
    defineAsset({
      id: "budget-variance-sample",
      source: new URL("./assets/budget_variance_sample.json", import.meta.url),
      target: "assets/budget_variance_sample.json",
    }),
    defineAsset({
      id: "dcf-analysis-template",
      source: new URL("./assets/dcf_analysis_template.md", import.meta.url),
      target: "assets/dcf_analysis_template.md",
    }),
    defineAsset({
      id: "dcf-valuation-sample",
      source: new URL("./assets/dcf_valuation_sample.json", import.meta.url),
      target: "assets/dcf_valuation_sample.json",
    }),
    defineAsset({
      id: "expected-output",
      source: new URL("./assets/expected_output.json", import.meta.url),
      target: "assets/expected_output.json",
    }),
    defineAsset({
      id: "forecast-report-template",
      source: new URL("./assets/forecast_report_template.md", import.meta.url),
      target: "assets/forecast_report_template.md",
    }),
    defineAsset({
      id: "forecast-sample",
      source: new URL("./assets/forecast_sample.json", import.meta.url),
      target: "assets/forecast_sample.json",
    }),
    defineAsset({
      id: "ratio-analysis-sample",
      source: new URL("./assets/ratio_analysis_sample.json", import.meta.url),
      target: "assets/ratio_analysis_sample.json",
    }),
    defineAsset({
      id: "sample-financial-data",
      source: new URL("./assets/sample_financial_data.json", import.meta.url),
      target: "assets/sample_financial_data.json",
    }),
    defineAsset({
      id: "variance-report-template",
      source: new URL("./assets/variance_report_template.md", import.meta.url),
      target: "assets/variance_report_template.md",
    })
  ],
});
