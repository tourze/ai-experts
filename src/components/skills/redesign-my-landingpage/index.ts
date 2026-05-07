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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先锁定目标用户、单一主转化动作、核心价值、信任证据和页面当前转化阻塞点。",
      "页面结构先参考 landing-page-anatomy 和 section-templates；文案读取 copy-templates，视觉方向读取 aesthetic-directions。",
      "实现默认走 React + Vite + TypeScript + Tailwind + shadcn/ui + Iconify，项目初始化或配置问题读取 shadcn-vite-setup。",
      "需要代码时优先复用资产中的 LandingPage 示例和 shadcn/Button/Iconify 模式；移动端、可访问性和 CTA 重复位置必须复查。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "落地页结构：首屏、信任区、价值解释、社会证明、FAQ、主 CTA 和页尾转化路径。",
      "文案、视觉方向、组件实现入口、真实产品画面/结果预览和移动端布局要求。",
      "若直接实现，输出可运行 React/Vite/Tailwind 代码、引用资源、测试/预览方式和转化假设。",
    ],
  }),
  references: [
    defineReference({
      id: "aesthetic-directions",
      source: new URL("./references/aesthetic-directions.md", import.meta.url),
      target: "references/aesthetic-directions.md",
      title: "aesthetic-directions.md",
      summary: "审美方向参考：现代、极简、品牌化等视觉风格示例与适用场景。",
      loadWhen: "需要确定落地页视觉基调或选择风格方向时读取。",
    }),
    defineReference({
      id: "copy-templates",
      source: new URL("./references/copy-templates.md", import.meta.url),
      target: "references/copy-templates.md",
      title: "copy-templates.md",
      summary: "高转化文案模板：标题、副标题、CTA 与信任信号的具体写法示例。",
      loadWhen: "需要撰写或优化落地页文案、标题和行动号召时读取。",
    }),
    defineReference({
      id: "iconify",
      source: new URL("./references/iconify.md", import.meta.url),
      target: "references/iconify.md",
      title: "iconify.md",
      summary: "Iconify 图标库的集成方式与在 shadcn/ui 项目中的最佳实践。",
      loadWhen: "需要选择、配置或替换落地页图标时读取。",
    }),
    defineReference({
      id: "landing-page-anatomy",
      source: new URL("./references/landing-page-anatomy.md", import.meta.url),
      target: "references/landing-page-anatomy.md",
      title: "landing-page-anatomy.md",
      summary: "落地页标准结构：首屏、信任区、方案说明、CTA 等各区块的布局逻辑。",
      loadWhen: "需要规划落地页总体结构或审查页面信息层级时读取。",
    }),
    defineReference({
      id: "section-templates",
      source: new URL("./references/section-templates.md", import.meta.url),
      target: "references/section-templates.md",
      title: "section-templates.md",
      summary: "各区块的可复用模板代码：Hero、Features、Testimonials、FAQ 等。",
      loadWhen: "需要快速搭建或替换落地页特定区块的实现时读取。",
    }),
    defineReference({
      id: "shadcn-vite-setup",
      source: new URL("./references/shadcn-vite-setup.md", import.meta.url),
      target: "references/shadcn-vite-setup.md",
      title: "shadcn-vite-setup.md",
      summary: "shadcn/ui 与 Vite 项目的初始化配置步骤和 Tailwind 集成要点。",
      loadWhen: "需要初始化或修复落地页项目的 shadcn/Vite/Tailwind 配置时读取。",
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
