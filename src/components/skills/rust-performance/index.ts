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
import { rustTypeDesignSkill } from "../rust-type-design/index";

export const rustPerformanceSkill = defineSkill({
  id: "rust-performance",
  fullName: "Rust 性能优化",
  description: "当用户要分析 Rust 性能瓶颈、做 flamegraph/benchmark、优化分配策略或判断\"该不该优化\"时使用。",
  useCases: [
    "需要定位 Rust 程序的性能瓶颈。",
    "使用 `cargo bench`、`cargo flamegraph`、`criterion` 做基准测试。",
    "判断\"应该改接口、改数据结构，还是先测量\"。",
    "优化分配策略：栈 vs 堆、`Vec` 预分配、避免不必要的 `clone`。",
  ],
  constraints: [
    "**先测量再动刀**。没有 profile 数据的\"性能优化\"是猜测。",
    "优化顺序：算法/数据结构 > API 边界 > 分配策略 > 微观技巧。",
    "`cargo clippy --all-targets --all-features -- -D warnings` 是免费的第一步。",
    "迭代器链通常比手写循环更快（零开销抽象 + 编译器优化）。",
    "`#[inline]` 只在跨 crate 热路径上有意义；同 crate 内编译器自行决定。",
    "Release 模式 (`--release`) 下才有意义的性能数据；Debug 下不要做性能判断。",
  ],
  checklist: [
    "优化前是否有 benchmark 基线？",
    "是否在 `--release` 模式下测量？",
    "热路径上是否有不必要的 `clone()`、`collect()`、`format!()`？",
  ],
  relatedSkills: [
    {
      get id() {
        return rustTypeDesignSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-type-design`。",
    },
    {
      get id() {
        return rustOwnershipIdiomsSkill.id;
      },
      reason: "联动：`rust-ownership-idioms` · `rust-type-design`",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Debug 模式判断性能",
      pass: "Release 测量",
    }),
    defineAntiPattern({
      fail: "未测量就重构",
      pass: "先 benchmark 再决定",
    }),
    defineAntiPattern({
      fail: "到处 #[inline(always)]",
      pass: "让编译器决定",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认性能目标、release 基线、硬件 / 数据集和可复现 benchmark。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "从 Clippy、cargo bench / criterion、flamegraph、系统 profiler 和堆分配工具逐层定位。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "优先改算法和数据结构，再评估 API 边界、分配策略和局部微优化。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "工具速查读取 `profiling-tools`，详细 benchmark 和归因流程读取 `chapter-03`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "性能基线、测量命令、数据集、profile 证据和瓶颈排序。",
      "算法 / 数据结构 / API / 分配 / 微优化层面的建议。",
      "验证计划、回归风险和还缺的测量数据。",
    ],
  }),
  references: [
    defineReference({
      id: "profiling-tools",
      source: new URL("./references/profiling-tools.md", import.meta.url),
      target: "references/profiling-tools.md",
      title: "Rust 性能工具速查",
      summary: "Clippy、cargo bench、criterion、flamegraph、perf/Instruments 和 DHAT 的使用场景。",
      loadWhen: "需要快速选择 Rust 性能测量或 profiling 工具时读取。",
    }),
    defineReference({
      id: "chapter-03",
      source: new URL("./references/chapter_03.md", import.meta.url),
      target: "references/chapter_03.md",
      title: "chapter_03.md",
      summary: "cargo bench/criterion/flamegraph 的使用流程、分配策略优化与性能归因方法论。",
      loadWhen: "需要建立 benchmark 基线、使用 flamegraph 定位热点或优化分配策略时读取。",
    }),
  ],
});
