import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
