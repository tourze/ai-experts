import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { croMethodologySkill } from "../cro-methodology/index";

export const redesignMyLandingpageSkill = defineSkill({
  id: "redesign-my-landingpage",
  fullName: "落地页重构（redesign-my-landingpage）",
  description: "在需要评审、重构或直接实现高转化落地页时使用，默认技术栈为 React + Vite + TypeScript + Tailwind + shadcn/ui + Iconify。",
  useCases: [
    "需要从零搭建营销页、销售页、注册页或产品落地页。",
    "已有页面转化弱，需要从首屏到页尾重排结构。",
    "需要直接交付可运行的 React/Vite/Tailwind 代码。",
  ],
  constraints: [
    "先锁定单一主转化动作，页面其它元素都服务这个动作。",
    "上半屏解决“我为什么继续看”，下半屏解决“我为什么现在行动”。",
    "默认实现约束是 shadcn/ui + Tailwind + Iconify，避免引入额外视觉系统分叉。",
    "若任务主要是实验设计或诊断，不直接写代码时，配合 `cro-methodology`。",
  ],
  checklist: [
    "是否只有一个主 CTA，且在关键位置重复出现。",
    "是否用真实产品画面或结果预览，而不是装饰图。",
    "是否首屏就说明目标用户、核心价值和下一步动作。",
    "是否兼顾移动端排版、可访问性和组件一致性。",
  ],
  relatedSkills: [
    {
      get id() {
        return croMethodologySkill.id;
      },
      reason: "若任务主要是实验设计或诊断，不直接写代码时，配合 `cro-methodology`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "shadcn 模板拼装",
      pass: "业务驱动结构",
    }),
    defineAntiPattern({
      fail: "抽象大词",
      pass: "具体动词 + 数字",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "aesthetic-directions",
      source: new URL("./references/aesthetic-directions.md", import.meta.url),
      target: "references/aesthetic-directions.md",
      title: "aesthetic-directions.md",
      summary: "Reference material for redesign-my-landingpage.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "copy-templates",
      source: new URL("./references/copy-templates.md", import.meta.url),
      target: "references/copy-templates.md",
      title: "copy-templates.md",
      summary: "Reference material for redesign-my-landingpage.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "iconify",
      source: new URL("./references/iconify.md", import.meta.url),
      target: "references/iconify.md",
      title: "iconify.md",
      summary: "Reference material for redesign-my-landingpage.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "landing-page-anatomy",
      source: new URL("./references/landing-page-anatomy.md", import.meta.url),
      target: "references/landing-page-anatomy.md",
      title: "landing-page-anatomy.md",
      summary: "Reference material for redesign-my-landingpage.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "section-templates",
      source: new URL("./references/section-templates.md", import.meta.url),
      target: "references/section-templates.md",
      title: "section-templates.md",
      summary: "Reference material for redesign-my-landingpage.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "shadcn-vite-setup",
      source: new URL("./references/shadcn-vite-setup.md", import.meta.url),
      target: "references/shadcn-vite-setup.md",
      title: "shadcn-vite-setup.md",
      summary: "Reference material for redesign-my-landingpage.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
  assets: [
    defineAsset({
      id: "vite-shadcn-iconify-landing",
      source: new URL("./assets/vite-shadcn-iconify-landing/", import.meta.url),
      target: "assets/vite-shadcn-iconify-landing",
    })
  ],
});
