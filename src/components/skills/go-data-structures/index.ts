import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goDataStructuresSkill = defineSkill({
  id: "go-data-structures",
  fullName: "go-data-structures",
  description: "当需要选择、优化或理解 Go 数据结构内部机制：slice 容量增长、map 哈希桶、泛型容器、container/*、unsafe.Pointer、copy 语义时使用。",
  useCases: [
    "选择 slice vs array vs map vs container/* 等容器，或排查容量/性能问题。",
    "涉及 slice 增长策略、backing array 别名、map 扩容与不缩容特性。",
    "使用泛型容器、`unsafe.Pointer`、`weak.Pointer` 或编写自定义数据结构。",
    "别名/nil 陷阱配合 [go-safety](../go-error-handling/SKILL.md)；并发容器配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)；内存布局优化配合 [go-performance](../go-performance/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "map-internals",
      source: new URL("./references/map-internals.md", import.meta.url),
      target: "references/map-internals.md",
      title: "map-internals.md",
      summary: "Reference material for go-data-structures.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "slice-internals",
      source: new URL("./references/slice-internals.md", import.meta.url),
      target: "references/slice-internals.md",
      title: "slice-internals.md",
      summary: "Reference material for go-data-structures.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
