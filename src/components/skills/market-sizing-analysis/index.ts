import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { fundraiseAdvisorSkill } from "../fundraise-advisor/index";
import { startupIcpDefinerSkill } from "../startup-icp-definer/index";

export const marketSizingAnalysisSkill = defineSkill({
  id: "market-sizing-analysis",
  fullName: "市场规模分析",
  description: "当用户要计算 TAM/SAM/SOM、验证市场空间、支撑商业计划或融资叙事时使用；支持 top-down、bottom-up 和 value theory 三种方法。",
  useCases: [
    "创业立项、融资材料、年度规划或新市场机会评估。",
    "需要参考 [references/data-sources.md](references/data-sources.md) 与 [examples/saas-market-sizing.md](examples/saas-market-sizing.md)。",
    "与客户画像或融资故事联动时，可配合 `startup-icp-definer` 和 `fundraise-advisor`。",
  ],
  constraints: [
    "同时给出方法、假设和数据来源，不允许只报一个大数字。",
    "TAM/SAM/SOM 要口径一致，避免一个按用户数、一个按收入口径混算。",
    "对新市场或新类别，优先写假设边界和不确定性，而不是装作数字很精确。",
  ],
  checklist: [
    "已说明数据来源、年份、地区和口径。",
    "至少使用两种方法交叉验证结果。",
    "SAM/SOM 与渠道能力、ICP 和资源约束一致。",
    "对不确定性和关键敏感参数有说明。",
  ],
  relatedSkills: [
    {
      get id() {
        return fundraiseAdvisorSkill.id;
      },
      reason: "与客户画像或融资故事联动时，可配合 `startup-icp-definer` 和 `fundraise-advisor`。",
    },
    {
      get id() {
        return startupIcpDefinerSkill.id;
      },
      reason: "与客户画像或融资故事联动时，可配合 `startup-icp-definer` 和 `fundraise-advisor`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全球总盘 = TAM",
      pass: "top-down + bottom-up 交叉",
    }),
    defineAntiPattern({
      fail: "漏定价/地域差",
      pass: "显式假设",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "用 TAM/SAM/SOM 和多方法交叉验证，把市场空间估算成有口径、有假设、有敏感性的商业判断。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先定义市场边界、地区、年份、币种、客户单位、收入模型和 TAM/SAM/SOM 口径。",
      "读取 `data-sources` reference 查找或评估数据来源，记录数据年份、可信度和缺口。",
      "至少做两种估算：top-down、bottom-up 或 value theory，并分别列出假设、公式和结果。",
      "检查 TAM/SAM/SOM 是否使用一致口径，避免用户数、收入、地区或价格体系混算。",
      "把 SAM/SOM 与 ICP、渠道能力、销售周期、资源约束和融资叙事对齐。",
      "做敏感性分析：找出最影响结论的价格、渗透率、转化率、市场增长率或覆盖范围。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "TAM/SAM/SOM 定义、口径和边界。",
      "方法 × 假设 × 公式 × 结果的市场规模表。",
      "数据来源、可信度、年份和不确定性说明。",
      "敏感参数、交叉验证结论和可用于规划/融资的叙事要点。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "data-sources",
      source: new URL("./references/data-sources.md", import.meta.url),
      target: "references/data-sources.md",
      title: "data-sources.md",
      summary: "市场规模估算的常用数据来源、行业报告渠道和可信度评估方法。",
      loadWhen: "需要查找市场数据来源、确定数据口径或评估数据可信度时读取。",
    }),
  ],
});
