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
import { rustAsyncPatternsSkill } from "../rust-async-patterns/index";
import { rustErrorHandlingSkill } from "../rust-error-handling/index";
import { rustTestingSkill } from "../rust-testing/index";
import { rustTypeDesignSkill } from "../rust-type-design/index";

export const rustOwnershipIdiomsSkill = defineSkill({
  id: "rust-ownership-idioms",
  fullName: "Rust 所有权与惯用法",
  description: "当需要决定 Rust 借用/所有权边界、选择 Box/Rc/Arc 智能指针、在静态分发与 `dyn Trait` 之间取舍、或配置 Clippy lint 基线时使用。",
  useCases: [
    "新写 Rust 模块、函数、trait 或类型时，需要先定借用/所有权边界。",
    "评审中判断 `.clone()`、`unwrap()`、`Box`、`Rc`、`Arc`、`dyn Trait` 是否合理。",
    "选择 `&T` vs `T` vs `Box<T>` vs `Rc<T>` vs `Arc<T>` 时需要决策依据。",
    "配置 Clippy lint 基线或处理 Clippy 警告时。",
  ],
  constraints: [
    "默认借用而非克隆。参数优先 `&str`、`&[T]`、`&Path`，除非调用方必须转移所有权。",
    "生产代码禁止把 `unwrap()` / `expect()` 当控制流；fail-fast 例外须写明原因。",
    "`clone()` 出现在循环内或热路径上时要质疑——往往是 API 边界设计错误的信号。",
    "选择分发：默认泛型静态分发；只有异构集合、插件边界或缩短编译时间时才转 `dyn Trait`。",
    "`TODO` 必须可追踪，如 `// TODO(#42): 移除兼容分支`。",
    "`#[allow(...)]` 优先替换为 `#[expect(...)]` 并写明原因。",
  ],
  checklist: [
    "参数能否再借用一层而不是提早拿走所有权？",
    "循环内的 `clone()` / `collect()` 是否必要？",
    "`#[allow(...)]` 是否都能改为 `#[expect(...)]` 并注明原因？",
  ],
  relatedSkills: [
    {
      get id() {
        return rustTestingSkill.id;
      },
      reason: "联动：`rust-error-handling` · `rust-testing` · `rust-type-design` · `rust-async-patterns`。",
    },
    {
      get id() {
        return rustTypeDesignSkill.id;
      },
      reason: "联动：`rust-error-handling` · `rust-testing` · `rust-type-design` · `rust-async-patterns`。",
    },
    {
      get id() {
        return rustAsyncPatternsSkill.id;
      },
      reason: "联动：`rust-error-handling` · `rust-testing` · `rust-type-design` · `rust-async-patterns`。",
    },
    {
      get id() {
        return rustErrorHandlingSkill.id;
      },
      reason: "联动：`rust-error-handling` · `rust-testing` · `rust-type-design` · `rust-async-patterns`",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "借用报错就 clone",
      pass: "收紧 API 边界",
    }),
    defineAntiPattern({
      fail: "unwrap 当控制流",
      pass: "? + 显式错误",
    }),
    defineAntiPattern({
      fail: "全部 dyn Trait",
      pass: "默认泛型",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认数据所有者、调用生命周期、线程边界、热路径和是否需要共享可变状态。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "默认借用和泛型，只有边界需要才转所有权、智能指针或 dyn Trait。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "审查循环内 clone / collect、unwrap 控制流和 `#[allow]` lint 豁免。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "智能指针速查读取 `pointer-guide`；借用、Clippy 和 Send / Sync 深入内容读取对应 chapter reference。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "API 借用 / 所有权边界、智能指针选择和线程安全约束。",
      "clone / collect / unwrap / allow 的风险点和替代方案。",
      "需要联动错误处理、测试、类型设计或 async 的后续问题。",
    ],
  }),
  references: [
    defineReference({
      id: "pointer-guide",
      source: new URL("./references/pointer-guide.md", import.meta.url),
      target: "references/pointer-guide.md",
      title: "Rust 智能指针速查",
      summary: "`&T`、Box、Rc、Arc、Cell/RefCell、Mutex/RwLock 的所有权、线程安全和典型场景。",
      loadWhen: "需要快速选择 Rust 借用、所有权或智能指针方案时读取。",
    }),
    defineReference({
      id: "chapter-01",
      source: new URL("./references/chapter_01.md", import.meta.url),
      target: "references/chapter_01.md",
      title: "chapter_01.md",
      summary: "所有权与借用规则详解：引用、切片、生命周期标注与常见借用错误示例。",
      loadWhen: "需要决策借用/所有权边界或排查借用检查器错误时读取。",
    }),
    defineReference({
      id: "chapter-02",
      source: new URL("./references/chapter_02.md", import.meta.url),
      target: "references/chapter_02.md",
      title: "chapter_02.md",
      summary: "Clippy lint 配置、常见警告处理与 lint 基线管理策略。",
      loadWhen: "需要配置 Clippy lint 基线或处理 Clippy 警告时读取。",
    }),
    defineReference({
      id: "chapter-09",
      source: new URL("./references/chapter_09.md", import.meta.url),
      target: "references/chapter_09.md",
      title: "chapter_09.md",
      summary: "Box/Rc/Arc/Send/Sync 智能指针详解与多语言内存管理对比。",
      loadWhen: "需要在 Box/Rc/Arc 之间选择或理解 Send/Sync 约束时读取。",
    }),
  ],
});
