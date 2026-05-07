import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { goConcurrencyPatternsSkill } from "../go-concurrency-patterns/index";
import { goPerformanceSkill } from "../go-performance/index";

export const goDataStructuresSkill = defineSkill({
  id: "go-data-structures",
  fullName: "go-data-structures",
  description: "当需要选择、优化或理解 Go 数据结构内部机制：slice 容量增长、map 哈希桶、泛型容器、container/*、unsafe.Pointer、copy 语义时使用。",
  useCases: [
    "选择 slice vs array vs map vs container/* 等容器，或排查容量/性能问题。",
    "涉及 slice 增长策略、backing array 别名、map 扩容与不缩容特性。",
    "使用泛型容器、`unsafe.Pointer`、`weak.Pointer` 或编写自定义数据结构。",
    "别名、nil、copy 语义本 skill 内处理；并发容器配合 `go-concurrency-patterns`；内存布局优化配合 `go-performance`。",
  ],
  constraints: [
    "| 约束 | 说明 |\n|------|------|\n| 预分配 | 大小已知时用 `make([]T, 0, n)` 或 `make(map[K]V, n)` |\n| slice 增长 | cap < 256 翻倍；cap >= 256 按 `1.25x + 192` 增长 |\n| array | 仅编译期已知大小时使用；函数参数会复制整个数组 |\n| map 不缩容 | 大量删除后应替换为新 map，否则内存不释放 |\n| strings.Builder | 拼接字符串；`defer b.Reset()` 复用 |\n| bytes.Buffer | 双向 I/O；内容可变，`b.Bytes()` 返回内部切片需注意别名 |\n| 泛型约束 | 使用最严格约束：`comparable` > `cmp.Ordered` > `any` |\n| unsafe.Pointer | 仅允许 6 种合法转换模式（见 spec） |\n| weak.Pointer[T] | Go 1.24+，缓存场景替代 `runtime.SetFinalizer` |\n| container/heap | 实现优先队列；需实现 `heap.Interface` |\n| container/list | 双向链表，适合 LRU；零值即可用 |\n| container/ring | 环形缓冲区；固定大小轮转 |",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "append 后未接收返回值。",
      pass: "`s = append(s, x)` 始终赋值回原变量。",
    }),
    defineAntiPattern({
      fail: "共享 backing array 导致数据污染。",
      pass: "需隔离时用 copy 或三索引切片 `s[:n:n]`。",
    }),
    defineAntiPattern({
      fail: "map 并发读写 panic。",
      pass: "单协程写 + sync.RWMutex 读，或用 sync.Map（高读低写场景）。",
    }),
    defineAntiPattern({
      fail: "range 循环变量复用导致闭包捕获错误。",
      pass: "Go 1.22+ 已修复；旧版本需 `v := v`。",
    }),
    defineAntiPattern({
      fail: "对大 map 大量删除后期望内存释放。",
      pass: "删除后重建 `make(map[K]V)`。",
    }),
    defineAntiPattern({
      fail: "unsafe.Pointer 跳过中间变量。",
      pass: "遵守 spec 6 种模式，避免 GC 出错。",
    }),
    defineAntiPattern({
      fail: "泛型约束写 `any` 但实际只需 `comparable`。",
      pass: "缩窄约束提升类型安全。",
    }),
  ],
  relatedSkills: [
    {
      get id() {
        return goConcurrencyPatternsSkill.id;
      },
      reason: "并发容器、channel 或 map 并发读写问题时联动。",
    },
    {
      get id() {
        return goPerformanceSkill.id;
      },
      reason: "内存布局、分配、map / slice 热路径或缓存策略优化时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认数据结构的所有权、是否跨 goroutine、是否会 append / mutate、是否暴露给调用方。",
      "按 copy 语义判断赋值、传参和返回值是否共享底层数据。",
      "slice / map 热路径或并发路径需要进一步读取 internals references，必要时复制防御。",
      "快速 copy 语义表读取 `copy-semantics`；slice / map 深入行为读取对应 reference。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "当前数据结构的 copy / alias / mutation 风险。",
      "是否需要 defensive copy、容量限制、map 初始化或并发保护。",
      "需要联动性能、并发或 API 设计的后续问题。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "copy-semantics",
      source: new URL("./references/copy-semantics.md", import.meta.url),
      target: "references/copy-semantics.md",
      title: "Go Copy 语义速查",
      summary: "array、slice、map、channel、string 和 struct 的赋值复制内容与底层共享关系。",
      loadWhen: "需要快速判断 Go 赋值、传参或返回是否共享底层数据时读取。",
    }),
    defineReference({
      id: "map-internals",
      source: new URL("./references/map-internals.md", import.meta.url),
      target: "references/map-internals.md",
      title: "map-internals.md",
      summary: "Go map 哈希桶结构、扩容机制与不缩容特性的内部原理。",
      loadWhen: "需要排查 map 内存问题或理解 map 扩容/删除行为时读取。",
    }),
    defineReference({
      id: "slice-internals",
      source: new URL("./references/slice-internals.md", import.meta.url),
      target: "references/slice-internals.md",
      title: "slice-internals.md",
      summary: "Go slice 内部结构、增长策略与 backing array 别名陷阱。",
      loadWhen: "需要排查 slice 共享/别名问题或优化 slice 预分配时读取。",
    }),
  ],
});
