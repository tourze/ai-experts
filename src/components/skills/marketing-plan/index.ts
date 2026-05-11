import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { contentStrategySkill } from "../content-strategy/index";
import { paidAdsSkill } from "../paid-ads/index";
import { stpSegmentationSkill } from "../stp-segmentation/index";

export const marketingPlanSkill = defineSkill({
  id: "marketing-plan",
  fullName: "市场方案策划",
  description: "当用户要写市场方案、推广策划案、上市传播计划、整合营销方案，或把 Brief 转成阶段策略和落地活动时使用；若只做 STP、4P、投放预算或活动复盘，切到对应 skill。",
  useCases: [
    "从产品 Brief、老板口头需求或零散资料中整理完整市场推广方案。",
    "为新品上市、版本发布、品牌节点、游戏/APP 推广、线下活动或整合营销输出阶段策略。",
    "需要把产品卖点、竞品环境、用户洞察、传播定位、渠道节奏和具体活动串成一个可执行方案。",
  ],
  constraints: [
    "顺序门禁：Brief -> 产品/市场/用户分析 -> 定位包装 -> 推广规划 -> 活动落地；前一层未确认，只能标注假设，不能直接排渠道。",
    "策略必须回扣证据源：产品卖点、竞品区隔、用户调研/评论、业务目标或资源约束。",
    "定位必须说明目标人群、核心利益点、差异化依据和心理洞察；slogan 只是定位表达，不是方案本体。",
    "阶段策略必须有目标、人群、事件、渠道组合和指标；只列时间轴或渠道清单不算方案。",
    "活动必须写清目的、对象、流程、素材/渠道、指标和风险。",
  ],
  checklist: [
    "Brief 中的目标、人群、时间、预算/资源、限制条件已拆清；缺失项已标注影响。",
    "产品卖点、竞品区隔和用户洞察都有证据。",
    "定位、slogan、创意、阶段策略和活动之间前后承接，没有各说各话。",
    "每个阶段都有主打人群和可衡量目标。",
    "每个活动都有执行流程、依赖、指标和风险。",
  ],
  relatedSkills: [
    {
      get skill() {
        return stpSegmentationSkill;
      },
      reason: "只需要做用户细分、目标市场、定位或 STP 判断，而不是完整推广方案时联动。",
    },
    {
      get skill() {
        return paidAdsSkill;
      },
      reason: "只需要广告账户、预算、出价、素材测试和受众结构时联动。",
    },
    {
      get skill() {
        return contentStrategySkill;
      },
      reason: "需要把信息支柱落到内容主题、内容日历和渠道内容矩阵时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "渠道清单冒充方案",
      pass: "先定策略主轴再排期",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先做 Brief 梳理：What、Who、When、Why、How、Where、目标、预算/资源、素材、限制和待确认项。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "分析输入：产品功能/玩法/调性/卖点/可信证据，竞品定位/打法/渠道，可区隔机会和用户转化阻力。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "输出定位包装：卖点 x 市场区隔 x 用户洞察的一句话定位，拆 3-5 个信息支柱，必要时给 slogan 方向。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "制定策略规划：一句话主轴、阶段主题、目标、人群、核心事件、渠道组合和指标。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "做节奏校验：每阶段必须承接上一阶段用户状态变化，不只列时间轴或渠道清单。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "落活动卡和资源清单：时间、目的、对象、流程、渠道/素材、指标、依赖、风险和分工；模板细节读取 market-plan-template。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Brief 复述、已确认/假设/待确认、产品/市场/用户分析表和证据来源。",
      "定位句、信息支柱、slogan 方向、阶段推广规划和指标。",
      "活动落地表、资源清单、依赖、风险、分工和需要联动的 STP/广告/内容策略事项。",
    ],
  }),
  references: [
    defineReference({
      id: "ansoff-matrix",
      source: new URL("./references/ansoff-matrix.md", import.meta.url),
      target: "references/ansoff-matrix.md",
      title: "ansoff-matrix.md",
      summary: "安索夫矩阵的详细说明与应用方法，包括市场渗透、市场开发、产品延伸和多元化四种增长策略。",
      loadWhen: "需要评估产品-市场增长策略组合或判断市场方案的战略方向时读取。",
    }),
    defineReference({
      id: "market-plan-template",
      source: new URL("./references/market-plan-template.md", import.meta.url),
      target: "references/market-plan-template.md",
      title: "market-plan-template.md",
      summary: "市场方案策划的标准化模板，覆盖从 Brief 分析到活动落地的完整结构。",
      loadWhen: "需要快速生成市场方案的框架或确保方案结构完整时读取。",
    }),
    defineReference({
      id: "marketing-mix-4p",
      source: new URL("./references/marketing-mix-4p.md", import.meta.url),
      target: "references/marketing-mix-4p.md",
      title: "marketing-mix-4p.md",
      summary: "4P 营销组合（产品、价格、渠道、促销）的详细分析方法与应用指南。",
      loadWhen: "需要系统审查产品、价格、渠道、促销四个维度的策略一致性时读取。",
    }),
  ],
});
