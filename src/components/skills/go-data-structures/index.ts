import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { goConcurrencyPatternsSkill } from "../go-concurrency-patterns/index";
import { goErrorHandlingSkill } from "../go-error-handling/index";
import { goPerformanceSkill } from "../go-performance/index";

export const goDataStructuresSkill = defineSkill({
  id: "go-data-structures",
  fullName: "go-data-structures",
  description: "当需要选择、优化或理解 Go 数据结构内部机制：slice 容量增长、map 哈希桶、泛型容器、container/*、unsafe.Pointer、copy 语义时使用。",
  useCases: [
    "选择 slice vs array vs map vs container/* 等容器，或排查容量/性能问题。",
    "涉及 slice 增长策略、backing array 别名、map 扩容与不缩容特性。",
    "使用泛型容器、`unsafe.Pointer`、`weak.Pointer` 或编写自定义数据结构。",
    "别名/nil 陷阱配合 `go-safety`；并发容器配合 `go-concurrency-patterns`；内存布局优化配合 `go-performance`。",
  ],
  constraints: [
    "| 约束 | 说明 |\n|------|------|\n| 预分配 | 大小已知时用 `make([]T, 0, n)` 或 `make(map[K]V, n)` |\n| slice 增长 | cap < 256 翻倍；cap >= 256 按 `1.25x + 192` 增长 |\n| array | 仅编译期已知大小时使用；函数参数会复制整个数组 |\n| map 不缩容 | 大量删除后应替换为新 map，否则内存不释放 |\n| strings.Builder | 拼接字符串；`defer b.Reset()` 复用 |\n| bytes.Buffer | 双向 I/O；内容可变，`b.Bytes()` 返回内部切片需注意别名 |\n| 泛型约束 | 使用最严格约束：`comparable` > `cmp.Ordered` > `any` |\n| unsafe.Pointer | 仅允许 6 种合法转换模式（见 spec） |\n| weak.Pointer[T] | Go 1.24+，缓存场景替代 `runtime.SetFinalizer` |\n| container/heap | 实现优先队列；需实现 `heap.Interface` |\n| container/list | 双向链表，适合 LRU；零值即可用 |\n| container/ring | 环形缓冲区；固定大小轮转 |",
  ],
  relatedSkills: [
    {
      get id() {
        return goConcurrencyPatternsSkill.id;
      },
      reason: "别名/nil 陷阱配合 `go-safety`；并发容器配合 `go-concurrency-patterns`；内存布局优化配合 `go-performance`。",
    },
    {
      get id() {
        return goPerformanceSkill.id;
      },
      reason: "别名/nil 陷阱配合 `go-safety`；并发容器配合 `go-concurrency-patterns`；内存布局优化配合 `go-performance`。",
    },
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      label: "go-safety",
      reason: "别名/nil 陷阱配合 `go-safety`；并发容器配合 `go-concurrency-patterns`；内存布局优化配合 `go-performance`。",
    },
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
