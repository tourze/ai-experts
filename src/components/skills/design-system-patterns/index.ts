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
import { modernWebDesignSkill } from "../modern-web-design/index";
import { responsiveDesignSkill } from "../responsive-design/index";

export const designSystemPatternsSkill = defineSkill({
  id: "design-system-patterns",
  fullName: "设计系统模式",
  description: "当用户需要搭建设计令牌、主题系统或组件架构时使用。适合涉及”设计系统””design tokens””主题切换””组件库规范””多品牌主题”的场景。",
  useCases: [
    "从零开始建立设计令牌、颜色体系、字号体系和组件 API。",
    "需要支持浅色/深色、多品牌或多租户主题。",
    "希望把 Figma、代码和组件库约束成同一套命名体系。",
    "需要审查项目里大量硬编码颜色、间距和阴影值。",
  ],
  constraints: [
    "令牌必须分层：原始值、语义值、组件值，不要把品牌色直接写进组件。",
    "主题切换必须以 CSS 变量或等价机制为中心，避免每个组件各自判断主题。",
    "组件 API 先稳定，再追求“无限灵活”；变体命名要服务业务语义。",
    "设计系统是约束系统，不是素材堆。新增 token 前先确认是否已有语义位。",
    "Tailwind 项目中也必须复用同一套 token 名称，避免工具类和组件 token 两套口径。",
  ],
  checklist: [
    "颜色、字号、间距、圆角、阴影都已有明确 token。",
    "token 命名同时覆盖设计语言和业务语义。",
    "主题切换不会要求组件内重复维护深浅色逻辑。",
    "组件变体与设计稿状态一一对应。",
    "文档里给出了“何时新增 token、何时复用 token”的判断标准。",
    "至少有一个真实业务页面验证过 token 的可复用性。",
  ],
  relatedSkills: [
    {
      get id() {
        return responsiveDesignSkill.id;
      },
      reason: "需要把 token、组件状态和断点策略落到响应式布局时联动。",
    },
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      reason: "需要把设计系统原则落到现代 Web 页面视觉、层级、间距和组件审美时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "组件里写硬编码值",
      pass: "组件只引 token",
    }),
    defineAntiPattern({
      fail: "一层 token 当所有用途",
      pass: "三层 token",
    }),
    defineAntiPattern({
      fail: "组件内部判断主题",
      pass: "CSS 变量统一切换",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先审计现有颜色、字号、间距、圆角、阴影、组件变体和硬编码值，确认真实业务页面。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "建立三层 token：原始值、语义值、组件值；组件只能引用 token，不直接写品牌色或硬编码值。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "用 CSS 变量或等价机制做主题切换，深色、多品牌和多租户覆盖不进入组件内部判断。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "稳定组件 API：variant、size、state 和业务语义先定，避免无限灵活的 props。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "需要 AI 协作持久化时落三层 Markdown：BRAND、MASTER、pages/<slug> overrides，按 BRAND → MASTER → page 顺序拼上下文。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "需要 Tailwind、主题架构或组件接口细节时读取对应 reference，并用至少一个真实业务页面验证 token 可复用性。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "token 分层：原始值、语义值、组件值、主题变量和新增 token 判断规则。",
      "组件 API、变体、状态、尺寸、主题切换策略和硬编码清理建议。",
      "BRAND/MASTER/pages overrides 文档结构、覆盖规则、真实页面验证和与响应式/现代 Web 的联动点。",
    ],
  }),
  references: [
    defineReference({
      id: "component-architecture",
      source: new URL("./references/component-architecture.md", import.meta.url),
      target: "references/component-architecture.md",
      title: "component-architecture.md",
      summary: "设计系统中组件的分层架构、API 设计和变体命名规范。",
      loadWhen: "需要设计组件接口、确定组件变体或审查组件库结构时读取。",
    }),
    defineReference({
      id: "design-tokens",
      source: new URL("./references/design-tokens.md", import.meta.url),
      target: "references/design-tokens.md",
      title: "design-tokens.md",
      summary: "设计令牌的三层体系（原始值、语义值、组件值）与命名约定。",
      loadWhen: "需要建立或扩展设计令牌系统，新增颜色/字号/间距 token 时读取。",
    }),
    defineReference({
      id: "master-overrides-pattern",
      source: new URL("./references/master-overrides-pattern.md", import.meta.url),
      target: "references/master-overrides-pattern.md",
      title: "master-overrides-pattern.md",
      summary: "设计系统的 master-overrides 模式，用于多品牌主题和局部覆盖场景。",
      loadWhen: "需要支持多品牌、多租户主题或处理令牌覆盖优先级时读取。",
    }),
    defineReference({
      id: "tailwind-design-system",
      source: new URL("./references/tailwind-design-system.md", import.meta.url),
      target: "references/tailwind-design-system.md",
      title: "tailwind-design-system.md",
      summary: "基于 Tailwind CSS 的设计系统集成方式，包括 token 映射和工具类策略。",
      loadWhen: "需要在 Tailwind 项目中搭建设计系统或复用 token 命名体系时读取。",
    }),
    defineReference({
      id: "theming-architecture",
      source: new URL("./references/theming-architecture.md", import.meta.url),
      target: "references/theming-architecture.md",
      title: "theming-architecture.md",
      summary: "CSS 变量驱动的主题架构设计，包括浅色/深色切换与运行时切换方案。",
      loadWhen: "需要设计主题切换架构或审查多主题实现方案时读取。",
    }),
  ],
});
