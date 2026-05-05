import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  relatedSkills: [
    {
      get id() {
        return stpSegmentationSkill.id;
      },
      reason: "只需要审查产品、价格、渠道、促销一致性时，切到 `stp-segmentation`。",
    },
    {
      get id() {
        return paidAdsSkill.id;
      },
      reason: "只需要广告账户、预算、出价和受众结构时，切到 `paid-ads`。",
    },
    {
      get id() {
        return contentStrategySkill.id;
      },
      reason: "需要内容日历时，配合 `content-strategy`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ansoff-matrix",
      source: new URL("./references/ansoff-matrix.md", import.meta.url),
      target: "references/ansoff-matrix.md",
      title: "ansoff-matrix.md",
      summary: "Reference material for marketing-plan.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "market-plan-template",
      source: new URL("./references/market-plan-template.md", import.meta.url),
      target: "references/market-plan-template.md",
      title: "market-plan-template.md",
      summary: "Reference material for marketing-plan.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "marketing-mix-4p",
      source: new URL("./references/marketing-mix-4p.md", import.meta.url),
      target: "references/marketing-mix-4p.md",
      title: "marketing-mix-4p.md",
      summary: "Reference material for marketing-plan.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
