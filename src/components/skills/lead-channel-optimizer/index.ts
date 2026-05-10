import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { paidAdsSkill } from "../paid-ads/index";

export const leadChannelOptimizerSkill = defineSkill({
  id: "lead-channel-optimizer",
  fullName: "获客渠道优化（lead-channel-optimizer）",
  description: "在需要判断获客渠道优先级、比较 ROI、削减低效投入或重排增长资源时使用。",
  useCases: [
    "渠道很多，但不知道现在该重押哪几个。",
    "需要比较广告、内容、推荐、外联等渠道的效率。",
    "想把预算和团队精力从低效渠道转向更高回报渠道。",
  ],
  constraints: [
    "渠道优先级必须同时看产出、稳定性和执行复杂度，不能只看单次线索成本。",
    "先统一口径：时间窗、归因方式、目标客户定义、是否算销售成本。",
    "输出必须包含“继续投入 / 保持 / 缩减 / 暂停”四类动作建议。",
  ],
  checklist: [
    "是否说明了渠道的口径、周期和数据来源。",
    "是否区分了“当前回报高”与“长期可放大”。",
    "是否写出资源重分配后的下一步动作。",
    "是否把品牌建设型渠道和直接转化型渠道分开比较。",
  ],
  relatedSkills: [
    {
      get id() {
        return paidAdsSkill.id;
      },
      reason: "若需要重做广告结构，配合 `paid-ads`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只看 CPL",
      pass: "CPL + 质量 + 闭环",
    }),
    defineAntiPattern({
      fail: "“全都做”",
      pass: "4 类动作",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先统一时间窗、归因方式、目标客户定义、线索质量口径和是否计入销售成本。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按渠道比较成本、线索质量、规模潜力、稳定性、执行复杂度和闭环转化。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "把渠道分成继续投入、保持、缩减、暂停四类动作，并说明资源重分配后的下一步。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "若结论指向广告账户结构或创意/受众问题，联动 paid-ads。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "渠道、成本、线索质量、规模潜力和建议动作对照表。",
      "品牌建设型渠道与直接转化型渠道的分开判断。",
      "预算/人力重分配建议、暂停条件和后续 paid ads 专项入口。",
    ],
  }),
});
