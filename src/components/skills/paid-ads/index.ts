import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ad-copy-templates",
      source: new URL("./references/ad-copy-templates.md", import.meta.url),
      target: "references/ad-copy-templates.md",
      title: "ad-copy-templates.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "ad-creative",
      source: new URL("./references/ad-creative.md", import.meta.url),
      target: "references/ad-creative.md",
      title: "ad-creative.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "audience-targeting",
      source: new URL("./references/audience-targeting.md", import.meta.url),
      target: "references/audience-targeting.md",
      title: "audience-targeting.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "competitive-ads-extractor",
      source: new URL("./references/competitive-ads-extractor.md", import.meta.url),
      target: "references/competitive-ads-extractor.md",
      title: "competitive-ads-extractor.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "platform-setup-checklists",
      source: new URL("./references/platform-setup-checklists.md", import.meta.url),
      target: "references/platform-setup-checklists.md",
      title: "platform-setup-checklists.md",
      summary: "Reference material for paid-ads.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
