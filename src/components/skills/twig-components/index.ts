import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { symfonyUxSkill } from "../symfony-ux/index";

export const twigComponentsSkill = defineSkill({
  id: "twig-components",
  fullName: "Twig Components",
  description: "当用户要抽取 Twig 视图片段、实现 TwigComponent、LiveComponent 状态、props、表单联动或模板复用时使用。",
  useCases: [
    "需要在 Symfony 项目中抽取可复用的 TwigComponent 或交互式 LiveComponent。",
    "组件已经重复出现在多个 Twig 模板里，或模板逻辑复杂到难以维护。",
    "想在服务端渲染优先的前提下，为局部界面增加响应式交互。",
    "如果还在决定应该用 Stimulus、Turbo、TwigComponent 还是 LiveComponent，可先看 `symfony-ux`。",
    "需要设计 props、slots、attributes 合并、LiveProp 或模板复用边界。",
  ],
  constraints: [
    "先判断组件类型：静态可复用 UI 用 TwigComponent，交互后需要服务端重渲染时再上 LiveComponent。",
    "组件公共属性必须稳定、可命名、可组合，避免把页面级上下文隐式塞进组件内部。",
    "模板只负责展示，不要在 Twig 里堆复杂业务判断或副作用。",
    "LiveComponent 的可写状态必须显式标记为 `LiveProp(writable: true)`，不要靠隐式提交。",
    "组件应该复用现有样式和路由，不要为了抽组件而重造一层平行 UI 体系。",
  ],
  checklist: [
    "组件职责是否单一，且名字能准确表达它提供的 UI 能力。",
    "公共属性、slots、`attributes` 合并策略是否清晰，而不是依赖模板外部魔法变量。",
    "LiveComponent 是否只暴露必要的可写状态，并处理了空值、快速输入和重复请求。",
    "组件模板是否避免直接访问全局状态，改为通过显式 props 或 getter 输入。",
    "相同样式或交互是否已经有现成组件可复用，避免再造近似组件。",
  ],
  relatedSkills: [
    {
      get skill() {
        return symfonyUxSkill;
      },
      reason: "还在选择 Stimulus、Turbo、TwigComponent 或 LiveComponent 方案边界时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "静态展示上 LiveComponent",
      pass: "静态用 TwigComponent",
    }),
    defineAntiPattern({
      fail: "模板里写业务逻辑",
      pass: "通过显式 props 输入",
    }),
  ],
  references: [
    defineReference({
      id: "reference",
      source: new URL("./references/reference.md", import.meta.url),
      target: "references/reference.md",
      title: "Twig Components Reference",
      summary: "TwigComponent、LiveComponent、slots、状态和模板复用示例。",
      loadWhen: "需要实现或审查 Symfony UX TwigComponent / LiveComponent 细节时读取。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先判断组件类型：静态复用 UI 用 TwigComponent；交互后需要服务端重渲染再用 LiveComponent。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "定义组件职责、名称、公共 props、slots、`attributes` 合并策略和现有样式复用方式。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "TwigComponent 类用 `#[AsTwigComponent]` 暴露稳定 public 属性，模板放在 `templates/components/<Name>.html.twig`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "LiveComponent 类用 `#[AsLiveComponent]` 和 `DefaultActionTrait`；只有必要状态标记 `#[LiveProp(writable: true)]`。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "Live 模板输入用 `data-model`，快速输入场景加 debounce，并处理空值、重复请求和最小查询长度。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "模板只展示，不读取隐式全局状态；业务判断放到组件 getter、服务或上游 use case。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "组件方案：TwigComponent/LiveComponent 选择理由、职责、props、slots、attributes 和样式复用。",
      "实现清单：PHP 组件类、Twig 模板、LiveProp 状态、事件/输入模型和空值处理。",
      "风险与验证：重复组件规避、模板业务逻辑移除、请求频率控制和 Symfony UX 联动点。",
    ],
  }),
});
