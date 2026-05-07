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
import { redesignMyLandingpageSkill } from "../redesign-my-landingpage/index";

export const paidAdsSkill = defineSkill({
  id: "paid-ads",
  fullName: "付费投放（paid-ads）",
  description: "在需要规划、优化或扩展 Google Ads、Meta、LinkedIn、TikTok 等付费投放时使用。",
  useCases: [
    "从零搭建投放结构，或接手已有账户做诊断与优化。",
    "需要判断平台选择、预算分配、出价方式和受众策略。",
    "已有创意但不知道怎么挂到投放结构里验证。",
  ],
  constraints: [
    "先明确业务目标、目标 CPA/ROAS、预算边界和转化动作，再谈平台与结构。",
    "创意、受众、落地页要拆开排查；不要把所有问题都归到“平台学习期”。",
    "平台执行细节优先以 [platform-setup-checklists](references/platform-setup-checklists.md) 和 [audience-targeting](references/audience-targeting.md) 为准。",
    "若着陆页承接弱，配合 `redesign-my-landingpage`。",
  ],
  checklist: [
    "是否写清了目标、预算、归因和学习期预期。",
    "是否区分获客、再营销、品牌词和实验流量。",
    "是否给出了停投、扩量和复盘条件。",
    "是否将创意测试与受众测试拆开。",
  ],
  relatedSkills: [
    {
      get id() {
        return redesignMyLandingpageSkill.id;
      },
      reason: "若着陆页承接弱，配合 `redesign-my-landingpage`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "一个 campaign 全堆",
      pass: "按层级拆",
    }),
    defineAntiPattern({
      fail: "只调出价不修创意",
      pass: "漏斗逐层诊断",
    }),
    defineAntiPattern({
      fail: "目标不清就讨论技巧",
      pass: "先量化目标",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先明确业务目标、目标 CPA/ROAS、预算边界、转化动作、归因方式和学习期预期。",
      "搭建或诊断账户结构时按 Brand、Non-brand、Retargeting、实验流量等层级拆开。",
      "每层输出目标受众、关键词/兴趣、创意变量、着陆页、停投/扩量/复盘条件。",
      "平台设置读取 `platform-setup-checklists`，受众读 `audience-targeting`，文案和创意读 ad copy / creative references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "平台、目标、预算、campaign 层级、受众、关键词/兴趣、创意变量和着陆页。",
      "停投、扩量、复盘条件和学习期预期。",
      "创意/受众/落地页拆分诊断，以及需要联动 landing page 重设计的承接风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "ad-copy-templates",
      source: new URL("./references/ad-copy-templates.md", import.meta.url),
      target: "references/ad-copy-templates.md",
      title: "ad-copy-templates.md",
      summary: "各投放平台的广告文案模板，包括标题、描述和行动号召的最佳实践写法。",
      loadWhen: "需要撰写或优化广告文案，参考不同平台的文案模板时读取。",
    }),
    defineReference({
      id: "ad-creative",
      source: new URL("./references/ad-creative.md", import.meta.url),
      target: "references/ad-creative.md",
      title: "ad-creative.md",
      summary: "广告创意的设计与测试方法，包括创意规格、A/B 测试和效果评估。",
      loadWhen: "需要设计广告创意素材或规划创意 A/B 测试方案时读取。",
    }),
    defineReference({
      id: "audience-targeting",
      source: new URL("./references/audience-targeting.md", import.meta.url),
      target: "references/audience-targeting.md",
      title: "audience-targeting.md",
      summary: "各投放平台的受众定向策略，包括人群定义、相似扩展和再营销设置。",
      loadWhen: "需要定义投放受众、设置定向策略或优化人群圈选时读取。",
    }),
    defineReference({
      id: "competitive-ads-extractor",
      source: new URL("./references/competitive-ads-extractor.md", import.meta.url),
      target: "references/competitive-ads-extractor.md",
      title: "competitive-ads-extractor.md",
      summary: "竞品广告的调研与分析方法，帮助了解竞品投放策略和创意方向。",
      loadWhen: "需要分析竞品的广告投放策略或获取竞品创意灵感时读取。",
    }),
    defineReference({
      id: "platform-setup-checklists",
      source: new URL("./references/platform-setup-checklists.md", import.meta.url),
      target: "references/platform-setup-checklists.md",
      title: "platform-setup-checklists.md",
      summary: "各投放平台（Google Ads、Meta、LinkedIn、TikTok）的账户搭建与配置检查清单。",
      loadWhen: "需要搭建新投放账户或诊断现有账户配置问题时读取。",
    }),
  ],
});
