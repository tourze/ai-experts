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
import { designSystemPatternsSkill } from "../design-system-patterns/index";
import { modernWebDesignSkill } from "../modern-web-design/index";

export const industryDesignPresetsSkill = defineSkill({
  id: "industry-design-presets",
  fullName: "行业设计预设",
  description: "当用户要为特定行业产品选择视觉方向、配色、字体、风格或反模式时使用。",
  useCases: [
    "产品类型明确（fintech / healthcare / portfolio / gaming / spa 等），要快速锁定视觉方向。",
    "需要同时决定 风格 + 配色 + 字体对 + 关键效果 + 反模式。",
    "不知道某个行业\"不该做什么\"（比如 banking 忌 AI 紫粉渐变）。",
    "需要把行业预设接到设计系统 token、字体搭配和现代 Web 实现。",
  ],
  constraints: [
    "预设是**起点不是终点**：先照表落 60%，剩余 40% 由品牌差异化决定。",
    "行业语义先于视觉美感：banking 的首要情绪是\"值得托付\"，不是\"酷\"。",
    "每个行业都有反模式——选之前先看\"AVOID 清单\"。",
    "风格要和现代 Web 关键词对齐，配色要落到设计系统 token。",
    "不机械套用：如果产品是 \"B2B SaaS + Gen-Z 氛围\"，按\"主行业 + 次行业氛围\"叠加，不用单 preset。",
  ],
  relatedSkills: [
    {
      get skill() {
        return designSystemPatternsSkill;
      },
      reason: "需要把主色组、字体、效果和反模式沉淀为 semantic token 与组件约束时联动。",
    },
    {
      get skill() {
        return modernWebDesignSkill;
      },
      reason: "需要把行业风格落到具体 Web 布局、材质、层级、动效或 CSS 特征时联动。",
    },
  ],
  checklist: [
    "已挑出主行业 preset + 必要氛围词。",
    "5 要素（风格 / 配色 / 字体 / 效果 / 反模式）全部确认，而非只挑喜欢的。",
    "已检查 preset 的 AVOID 清单，没踩反模式。",
    "配色接入了设计系统 semantic token，不是组件里硬写。",
    "字体按 font-pairing-library 导入，不是每处自己写 font-family。",
    "风格实现对照 modern-web-design 的 CSS 特征清单。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跨行业套捷径",
      pass: "行业语义优先",
    }),
    defineAntiPattern({
      fail: "100% 套预设",
      pass: "60% 预设 + 40% 差异化",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确定主行业和 1-2 个氛围词，例如 trust、playful、luxury 或 technical。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "读取 presets-catalog 或对应行业 reference，取出风格、主色组、字体对、关键效果和 AVOID 清单。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按 60% 行业预设、40% 品牌差异化落地，不机械套用单一 preset。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "把主色组接入 design-system semantic token，字体对接 font-pairing-library，风格实现细节交给现代 Web 设计。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "检查行业语义是否优先于视觉好看：例如金融首要情绪是可托付，不能用廉价 AI 渐变破坏信任。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "主行业、氛围词、preset 来源和 5 要素：风格、配色、字体、效果、反模式。",
      "semantic token、字体导入、关键视觉效果、AVOID 清单和品牌差异化空间。",
      "与设计系统、现代 Web 实现和行业专属 reference 的联动建议。",
    ],
  }),
  references: [
    defineReference({
      id: "font-pairing-library",
      source: new URL("./references/font-pairing-library.md", import.meta.url),
      target: "references/font-pairing-library.md",
      title: "font-pairing-library.md",
      summary: "各行业字体配对推荐：风格分类、可用字体权重与搭配示例。",
      loadWhen: "需要为特定行业产品选择字体搭配时读取。",
    }),
    defineReference({
      id: "presets-catalog",
      source: new URL("./references/presets-catalog.md", import.meta.url),
      target: "references/presets-catalog.md",
      title: "presets-catalog.md",
      summary: "全行业设计预设目录：各行业的风格、配色、字体与反模式速查。",
      loadWhen: "需要快速浏览所有行业预设以确定最初方向时读取。",
    }),
    defineReference({
      id: "presets-events-culture",
      source: new URL("./references/presets-events-culture.md", import.meta.url),
      target: "references/presets-events-culture.md",
      title: "presets-events-culture.md",
      summary: "活动与文化行业的视觉预设：风格、配色、字体与反模式。",
      loadWhen: "需要为活动、票务或文化类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-finance-commerce",
      source: new URL("./references/presets-finance-commerce.md", import.meta.url),
      target: "references/presets-finance-commerce.md",
      title: "presets-finance-commerce.md",
      summary: "金融与电商行业的视觉预设：值得托付与高效转化的配色和风格。",
      loadWhen: "需要为银行、支付或电商类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-health-lifestyle",
      source: new URL("./references/presets-health-lifestyle.md", import.meta.url),
      target: "references/presets-health-lifestyle.md",
      title: "presets-health-lifestyle.md",
      summary: "健康与生活方式行业的视觉预设：清洁感、关怀感与自然色调。",
      loadWhen: "需要为医疗、健身或养生类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-local-services",
      source: new URL("./references/presets-local-services.md", import.meta.url),
      target: "references/presets-local-services.md",
      title: "presets-local-services.md",
      summary: "本地服务行业的视觉预设：信任感、社区感与区域特色设计元素。",
      loadWhen: "需要为本地生活服务类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-media-edu-care",
      source: new URL("./references/presets-media-edu-care.md", import.meta.url),
      target: "references/presets-media-edu-care.md",
      title: "presets-media-edu-care.md",
      summary: "媒体、教育与关怀行业的视觉预设：内容优先、亲和力与专业感的平衡。",
      loadWhen: "需要为媒体、教育或公益类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-mobility-realestate",
      source: new URL("./references/presets-mobility-realestate.md", import.meta.url),
      target: "references/presets-mobility-realestate.md",
      title: "presets-mobility-realestate.md",
      summary: "出行与房产行业的视觉预设：动态感、可靠性与空间展示设计。",
      loadWhen: "需要为出行、房产或物流类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-productivity-consumer",
      source: new URL("./references/presets-productivity-consumer.md", import.meta.url),
      target: "references/presets-productivity-consumer.md",
      title: "presets-productivity-consumer.md",
      summary: "生产力与消费行业的视觉预设：效率感、工具感与消费者吸引力。",
      loadWhen: "需要为工具、效率或消费类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-services-creative",
      source: new URL("./references/presets-services-creative.md", import.meta.url),
      target: "references/presets-services-creative.md",
      title: "presets-services-creative.md",
      summary: "服务与创意行业的视觉预设：展示创意能力与专业服务的平衡设计。",
      loadWhen: "需要为咨询、创意或服务类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-tech-saas",
      source: new URL("./references/presets-tech-saas.md", import.meta.url),
      target: "references/presets-tech-saas.md",
      title: "presets-tech-saas.md",
      summary: "科技与 SaaS 行业的视觉预设：现代感、技术信任与产品功能的展示。",
      loadWhen: "需要为科技或 SaaS 类产品选择视觉方向时读取。",
    }),
    defineReference({
      id: "presets-youth-public",
      source: new URL("./references/presets-youth-public.md", import.meta.url),
      target: "references/presets-youth-public.md",
      title: "presets-youth-public.md",
      summary: "青年与公共行业的视觉预设：年轻化、活力感与公共服务的亲和设计。",
      loadWhen: "需要为青年社区或公共服务类产品选择视觉方向时读取。",
    }),
  ],
});
