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
import { rustOwnershipIdiomsSkill } from "../rust-ownership-idioms/index";
import { rustPerformanceSkill } from "../rust-performance/index";

export const rustTypeDesignSkill = defineSkill({
  id: "rust-type-design",
  fullName: "Rust 类型设计",
  description: "当用户要在泛型与 trait object 之间做选择、设计静态/动态分发边界、或用类型状态模式把非法状态变成编译错误时使用。",
  useCases: [
    "选择泛型（静态分发）还是 `dyn Trait`（动态分发）。",
    "设计 trait object 的 object safety 约束。",
    "用类型状态模式（typestate）把非法操作顺序变成编译错误。",
    "在编译时间、二进制大小和运行时性能之间做权衡。",
  ],
  constraints: [
    "默认泛型静态分发——零开销、可内联、类型信息完整。",
    "只在真正需要异构集合、插件边界或缩短编译时间时转 `dyn Trait`。",
    "`dyn Trait` 要求 trait 是 object-safe（无泛型方法、不返回 `Self`）。",
    "类型状态适合有明确生命周期阶段的实体（Draft → Published、Connecting → Connected）。",
    "类型状态不适合阶段太多或需要运行时动态决定的场景——此时用枚举。",
  ],
  checklist: [
    "用了 `dyn Trait` 的地方，是否真的需要运行时多态？",
    "trait 是否 object-safe？是否意外加了泛型方法？",
    "类型状态的阶段数是否可控（<5）？",
  ],
  relatedSkills: [
    {
      get skill() {
        return rustPerformanceSkill;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-performance`。",
    },
    {
      get skill() {
        return rustOwnershipIdiomsSkill;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-performance`",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "默认 dyn 放弃零开销",
      pass: "默认泛型",
    }),
    defineAntiPattern({
      fail: "trait 方法带泛型",
      pass: "保持 object-safe",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认是否真的需要多态、类型是否编译期确定、是否存在阶段化状态机。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "默认选择泛型静态分发，只在异构集合、插件边界或编译时间压力下选择 dyn Trait。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "检查 trait object safety：无泛型方法、不返回 `Self`、receiver 兼容。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "分发决策树和 typestate 速查读取 `type-dispatch-guide`；深入示例读取 `chapter-06` / `chapter-07`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "泛型 / dyn Trait 选择、object safety 检查和性能 / 编译时间 trade-off。",
      "typestate 阶段设计、非法状态收口方式和何时改用 enum。",
      "需要联动 ownership 或 performance 的后续设计问题。",
    ],
  }),
  references: [
    defineReference({
      id: "type-dispatch-guide",
      source: new URL("./references/type-dispatch-guide.md", import.meta.url),
      target: "references/type-dispatch-guide.md",
      title: "Rust 分发与类型状态速查",
      summary: "泛型、dyn Trait 分发决策树和 typestate 最小示例。",
      loadWhen: "需要快速判断 Rust 类型分发或 typestate 方案时读取。",
    }),
    defineReference({
      id: "chapter-06",
      source: new URL("./references/chapter_06.md", import.meta.url),
      target: "references/chapter_06.md",
      title: "chapter_06.md",
      summary: "Rust 泛型、trait 约束和静态分发的高级模式。",
      loadWhen: "需要在泛型与 trait object 之间做选择或设计 trait 约束体系时读取。",
    }),
    defineReference({
      id: "chapter-07",
      source: new URL("./references/chapter_07.md", import.meta.url),
      target: "references/chapter_07.md",
      title: "chapter_07.md",
      summary: "Rust 类型状态模式、动态分发和 object safety 的深入示例。",
      loadWhen: "需要设计 typestate 模式或判断 dyn Trait 的 object safety 约束时读取。",
    }),
  ],
});
