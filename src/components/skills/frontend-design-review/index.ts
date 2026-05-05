import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { modernWebDesignSkill } from "../modern-web-design/index";
import { responsiveDesignSkill } from "../responsive-design/index";

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
    "[ ] 页面主目标一眼可见，主 CTA 不超过两个。",
    "[ ] 视觉层级通过尺寸、颜色、间距而非堆叠装饰完成。",
    "[ ] 设计 token、组件 API、状态命名与设计系统一致。",
    "[ ] 键盘焦点、禁用态、加载态、错误态都可见。",
    "[ ] 移动端与桌面端都保留清晰的信息与操作路径。",
    "[ ] 如涉及 AI 结果、自动化建议或风险操作，界面已提供透明说明。",
  ],
  relatedSkills: [
    {
      get id() {
        return responsiveDesignSkill.id;
      },
      reason: "`responsive-design`。",
    },
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      label: "web-design-guidelines",
      reason: "`web-design-guidelines`。",
    },
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      label: "refactoring-ui",
      reason: "`refactoring-ui`",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "absolute-bans",
      source: new URL("./references/absolute-bans.md", import.meta.url),
      target: "references/absolute-bans.md",
      title: "absolute-bans.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pattern-examples",
      source: new URL("./references/pattern-examples.md", import.meta.url),
      target: "references/pattern-examples.md",
      title: "pattern-examples.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "quick-checklist",
      source: new URL("./references/quick-checklist.md", import.meta.url),
      target: "references/quick-checklist.md",
      title: "quick-checklist.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "review-output-format",
      source: new URL("./references/review-output-format.md", import.meta.url),
      target: "references/review-output-format.md",
      title: "review-output-format.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "review-type-modifiers",
      source: new URL("./references/review-type-modifiers.md", import.meta.url),
      target: "references/review-type-modifiers.md",
      title: "review-type-modifiers.md",
      summary: "Reference material for frontend-design-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
