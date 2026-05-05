import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-03",
      source: new URL("./references/chapter_03.md", import.meta.url),
      target: "references/chapter_03.md",
      title: "chapter_03.md",
      summary: "Reference material for rust-performance.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
