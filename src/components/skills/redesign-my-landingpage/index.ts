import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
} from "../../sdk";

export const redesignMyLandingpageSkill = defineSkill({
  id: "redesign-my-landingpage",
  fullName: "落地页重构（redesign-my-landingpage）",
  description: "在需要评审、重构或直接实现高转化落地页时使用，默认技术栈为 React + Vite + TypeScript + Tailwind + shadcn/ui + Iconify。",
  useCases: [
    "需要从零搭建营销页、销售页、注册页或产品落地页。",
    "已有页面转化弱，需要从首屏到页尾重排结构。",
    "需要直接交付可运行的 React/Vite/Tailwind 代码。",
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
