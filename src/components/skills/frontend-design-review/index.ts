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
import { productDesignCriticSkill } from "../product-design-critic/index";
import { responsiveDesignSkill } from "../responsive-design/index";
import { uxHeuristicsSkill } from "../ux-heuristics/index";

export const frontendDesignReviewSkill = defineSkill({
  id: "frontend-design-review",
  fullName: "前端设计评审",
  description: "当需要审查前端界面质量或避免 AI 套版感时使用（UI 实现层：设计还原度、可访问性、响应式、设计系统一致性）。产品策略级设计审视用 `product-design-critic`；交互可用性诊断用 `ux-heuristics`。",
  useCases: [
    "审查已实现界面的视觉质量、交互清晰度和设计系统一致性。",
    "需要对 PR、组件、页面或核心流程给出设计层面的阻塞项。",
    "需要创建风格明确、非模板化的前端界面。",
    "需要在可访问性、响应式和工程实现之间做平衡。",
  ],
  constraints: [
    "评审优先指出问题，再给方案；结论要能落到具体文件、状态和组件。",
    "先判断用户任务是否清晰，再看视觉层级和美术方向。",
    "有设计系统时，以系统规则为第一约束；没有系统时，以一致性和可维护性为第一约束。",
    "创意设计要“有方向”，不是把所有流行效果堆在一起。",
    "低质量“AI 味”通常来自：默认字体、默认紫渐变、套路式卡片网格、无意义动画。",
  ],
  checklist: [
    "页面主目标一眼可见，主 CTA 不超过两个。",
    "视觉层级通过尺寸、颜色、间距而非堆叠装饰完成。",
    "设计 token、组件 API、状态命名与设计系统一致。",
    "键盘焦点、禁用态、加载态、错误态都可见。",
    "移动端与桌面端都保留清晰的信息与操作路径。",
    "如涉及 AI 结果、自动化建议或风险操作，界面已提供透明说明。",
  ],
  relatedSkills: [
    {
      get skill() {
        return responsiveDesignSkill;
      },
      reason: "评审发现断点、移动端密度、触控目标或容器自适应问题时联动。",
    },
    {
      get skill() {
        return modernWebDesignSkill;
      },
      reason: "`modern-web-design`：视觉方向、Web 设计规范和界面风格参考。",
    },
    {
      get skill() {
        return productDesignCriticSkill;
      },
      reason: "评审对象上升到产品策略、主流程决策、信任设计或治理暴露时联动。",
    },
    {
      get skill() {
        return uxHeuristicsSkill;
      },
      reason: "问题主要是导航、状态反馈、表单阻塞、信息架构或基础可用性启发式错误时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全是主角",
      pass: "主次分明",
    }),
    defineAntiPattern({
      fail: "只做 default 态",
      pass: "状态完整",
    }),
    defineAntiPattern({
      fail: "动画掩盖信息",
      pass: "先修结构",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先按用户目标、主次操作、设计系统、断点 / 状态、信任细节顺序评审。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "发现问题先给具体文件、组件、状态和阻塞级别，再给可执行修复方案。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "对 10 条 Absolute Bans 直接 P0 阻塞，不通过改色或改宽度绕过。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "评审顺序和示例读取 `review-sequence`；硬禁令、输出格式和 modifier 读取对应 references。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "按 P0/P1/P2 排序的界面质量、交互、响应式、状态和设计系统问题。",
      "每条问题对应的文件 / 组件 / 状态证据和修复建议。",
      "Absolute Bans、AI 套版感、可访问性和剩余设计风险。",
    ],
  }),
  references: [
    defineReference({
      id: "review-sequence",
      source: new URL("./references/review-sequence.md", import.meta.url),
      target: "references/review-sequence.md",
      title: "前端设计评审顺序",
      summary: "用户目标、主次操作、设计系统、断点/状态、信任细节的推荐评审顺序和按钮示例。",
      loadWhen: "需要快速开展前端界面质量评审时读取。",
    }),
    defineReference({
      id: "absolute-bans",
      source: new URL("./references/absolute-bans.md", import.meta.url),
      target: "references/absolute-bans.md",
      title: "absolute-bans.md",
      summary: "前端设计中必须避免的绝对禁止项清单，包括常见的 AI 套版感特征。",
      loadWhen: "需要审查界面是否包含低质量设计特征或对照禁止项检查实现时读取。",
    }),
    defineReference({
      id: "pattern-examples",
      source: new URL("./references/pattern-examples.md", import.meta.url),
      target: "references/pattern-examples.md",
      title: "pattern-examples.md",
      summary: "高质量前端设计模式的示例集合与设计原则说明。",
      loadWhen: "需要参考好的设计模式来改进界面或建立评审参照标准时读取。",
    }),
    defineReference({
      id: "quick-checklist",
      source: new URL("./references/quick-checklist.md", import.meta.url),
      target: "references/quick-checklist.md",
      title: "quick-checklist.md",
      summary: "前端设计评审的快速检查清单，覆盖视觉层级、可访问性和响应式。",
      loadWhen: "需要在快速审查界面或 PR 时对照清单逐项检查时读取。",
    }),
    defineReference({
      id: "review-output-format",
      source: new URL("./references/review-output-format.md", import.meta.url),
      target: "references/review-output-format.md",
      title: "review-output-format.md",
      summary: "前端设计评审的输出格式规范，包括问题分类、严重级别和修复建议。",
      loadWhen: "需要按统一格式输出设计评审结果或编写评审报告时读取。",
    }),
    defineReference({
      id: "review-type-modifiers",
      source: new URL("./references/review-type-modifiers.md", import.meta.url),
      target: "references/review-type-modifiers.md",
      title: "review-type-modifiers.md",
      summary: "前端设计评审的类型分类规则与修饰语定义。",
      loadWhen: "需要对评审发现进行分类分级或统一评审表达方式时读取。",
    }),
  ],
});
