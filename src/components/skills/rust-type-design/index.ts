import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
      get id() {
        return rustPerformanceSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-performance`。",
    },
    {
      get id() {
        return rustOwnershipIdiomsSkill.id;
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-06",
      source: new URL("./references/chapter_06.md", import.meta.url),
      target: "references/chapter_06.md",
      title: "chapter_06.md",
      summary: "Reference material for rust-type-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "chapter-07",
      source: new URL("./references/chapter_07.md", import.meta.url),
      target: "references/chapter_07.md",
      title: "chapter_07.md",
      summary: "Reference material for rust-type-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
