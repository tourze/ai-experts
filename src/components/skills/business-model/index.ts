import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { portersFiveForcesSkill } from "../porters-five-forces/index";
import { pricingStrategySkill } from "../pricing-strategy/index";

export const businessModelSkill = defineSkill({
  id: "business-model",
  fullName: "商业模式分析",
  description:
    "当用户要设计新商业模式、诊断现有产品变现、研究成熟公司商业模式，或用魏朱六要素分析中国市场因果逻辑、做产品-职能-市场铁三角一致性检验时使用。",
  useCases: [
    "`idea_to_model`：新业务、新产品或变现想法，需要生成 `3-5` 个商业模式选项。",
    "`model_diagnosis`：现有产品、网站或公司，需要诊断收入结构、变现缺口和升级机会。",
    "`company_case_study`：成熟公司研究，需要拆解利润池、可迁移经验和环境依赖。",
    "只看竞争结构时转 `porters-five-forces`；只做定价打包时转 `pricing-strategy`。",
    "中国市场商业模式因果链推演用[魏朱六要素](references/weizhu-model.md)；快速定位一致性检查用[业务铁三角](references/iron-triangle.md)。",
  ],
  constraints: [
    "先建 `market_environment`，再套画布：目标市场、买方、渠道、监管、支付、交付约束都会改变商业模式。",
    "每个关键判断都标注 `fact`、`estimate`、`hypothesis` 或 `recommendation`，并给证据等级。",
    "诊断和案例研究必须同时看直接竞品与跨行业 analog；不足时说明证据缺口。",
    "收入、GMV、TPV、AUM、用户数和 ARR 不能混用；金额估算要写公式、变量、低/中/高区间和置信度。",
    "不要把功能清单、组织架构或愿景口号误写成商业模式。",
  ],
  checklist: [
    "已选择一个主分支，并说明其他需求如何作为辅助模块处理。",
    "已建立市场环境画像，并说明地区、买方、渠道、监管和交付约束。",
    "已区分 `fact`、`estimate`、`hypothesis`、`recommendation`。",
    "每条收入线都有公式、变量、区间和置信度。",
    "诊断/案例研究已覆盖直接竞品和跨行业 analog；不足时说明原因。",
    "已包含 AI 作为成本驱动、效率杠杆、可收费单元或颠覆风险的判断。",
  ],
  relatedSkills: [
    {
      get id() {
        return pricingStrategySkill.id;
      },
      reason:
        "只看竞争结构时转 `porters-five-forces`；只做定价打包时转 `pricing-strategy`。",
    },
    {
      get id() {
        return portersFiveForcesSkill.id;
      },
      reason:
        "只看竞争结构时转 `porters-five-forces`；只做定价打包时转 `pricing-strategy`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "目标客户“所有人”",
      pass: "显式画像 + 证据",
    }),
    defineAntiPattern({
      fail: "把 GMV 当收入",
      pass: "写清收入基础",
    }),
    defineAntiPattern({
      fail: "只看直接竞品",
      pass: "加 cross-industry analog",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先选择主分支：`idea_to_model`、`model_diagnosis` 或 `company_case_study`，并说明辅助模块如何处理。",
      "读取 `report-contract` reference，按分支确认必备字段、章节约定和输出边界。",
      "建立 `market_environment`：目标市场、买方、渠道、监管、支付、交付约束和竞争环境。",
      "收集证据并分级：`S/A` 支撑摘要事实，`B/C/D` 只支撑信号、估算或假设。",
      "需要 JSON 审计源或字段示例时读取 `analysis-json-template` reference；中国市场因果链读取 `weizhu-model`，一致性检查读取 `iron-triangle`。",
      "生成结构化 JSON 作为审计源，再输出人类可读摘要、关键判断和 HTML 模块规划。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "已选择的分析分支和市场环境画像。",
      "商业模式结构、收入线、公式、变量、区间和置信度。",
      "证据分级、事实/估算/假设/建议标注和证据缺口。",
      "结构化 JSON 审计源、人类摘要和模块化报告规划。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "analysis-json-template",
      source: new URL("./references/analysis-json-template.md", import.meta.url),
      target: "references/analysis-json-template.md",
      title: "商业模式 JSON 审计源模板",
      summary: "商业模式分析的结构化 JSON 字段示例，用于保留证据、公式、收入线和置信度。",
      loadWhen: "需要生成或校验商业模式分析的结构化 JSON 审计源时读取。",
    }),
    defineReference({
      id: "iron-triangle",
      source: new URL("./references/iron-triangle.md", import.meta.url),
      target: "references/iron-triangle.md",
      title: "iron-triangle.md",
      summary: "商业模式铁三角：价值主张、盈利模式与运营能力的评估框架。",
      loadWhen:
        "需要评估商业模式三要素的匹配度或发现薄弱环节时读取。",
    }),
    defineReference({
      id: "report-contract",
      source: new URL("./references/report-contract.md", import.meta.url),
      target: "references/report-contract.md",
      title: "report-contract.md",
      summary: "商业模型分析报告的输出格式与章节约定。",
      loadWhen:
        "需要按标准格式输出商业模型分析报告时读取。",
    }),
    defineReference({
      id: "weizhu-model",
      source: new URL("./references/weizhu-model.md", import.meta.url),
      target: "references/weizhu-model.md",
      title: "weizhu-model.md",
      summary: "魏朱商业模式：定位、业务系统、盈利模式、关键资源、现金流与价值的六要素分析。",
      loadWhen:
        "需要以中国本土商业框架分析或重构商业模式时读取。",
    }),
  ],
});
